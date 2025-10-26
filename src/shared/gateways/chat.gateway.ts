import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from 'src/entities/chat.entity';
import { JwtService } from '@nestjs/jwt';
import { Claims } from 'src/jwt/jwt.strategy';

interface AuthenticatedSocket extends Socket {
  userProfileId?: string;
}

export interface JoinChatData {
  chatId: string;
  token: string;
}

export interface LeaveChatData {
  chatId: string;
}

export interface SendMessageData {
  chatId: string;
  content: string;
}

export interface NewMessageEvent {
  chatId: string;
  message: {
    senderId: string;
    content: string;
    timestamp: Date;
  };
}

export interface UserJoinedEvent {
  userProfileId: string;
  chatId: string;
}

export interface UserLeftEvent {
  userProfileId: string;
  chatId: string;
}

export interface ChatError {
  message: string;
}

export enum ChatEvents {
  NEW_MESSAGE = 'new_message',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  JOINED_CHAT = 'joined_chat',
  LEFT_CHAT = 'left_chat',
  JOIN_CHAT = 'join_chat',
  LEAVE_CHAT = 'leave_chat',
  SEND_MESSAGE = 'send_message',
  JOIN_CHAT_ERROR = 'join_chat_error',
  LEAVE_CHAT_ERROR = 'leave_chat_error',
  SEND_MESSAGE_ERROR = 'send_message_error',
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userProfileId = client.userProfileId;
    if (!userProfileId) return;

    const userSockets = this.userSockets.get(userProfileId);
    if (userSockets) {
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(userProfileId);
      }
    }
  }

  @SubscribeMessage(ChatEvents.JOIN_CHAT)
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinChatData,
  ) {
    try {
      const userProfileId = this.extractUserProfileIdFromToken(data.token);

      if (!userProfileId) {
        client.emit(ChatEvents.JOIN_CHAT_ERROR, { message: 'Invalid token' });
        return;
      }

      const hasAccess = await this.verifyChatAccess(data.chatId, userProfileId);
      if (!hasAccess) {
        client.emit(ChatEvents.JOIN_CHAT_ERROR, {
          message: 'Access denied to this chat',
        });
        return;
      }

      client.userProfileId = userProfileId;

      if (!this.userSockets.has(userProfileId)) {
        this.userSockets.set(userProfileId, new Set());
      }
      this.userSockets.get(userProfileId)!.add(client.id);

      await client.join(data.chatId);

      this.logger.log(`User ${userProfileId} joined chat ${data.chatId}`);
      client.emit(ChatEvents.JOINED_CHAT, { chatId: data.chatId });

      client.to(data.chatId).emit(ChatEvents.USER_JOINED, {
        userProfileId,
        chatId: data.chatId,
      });
    } catch (error) {
      this.logger.error('Error joining chat:', error);
      client.emit(ChatEvents.JOIN_CHAT_ERROR, {
        message: 'Failed to join chat',
      });
    }
  }

  @SubscribeMessage(ChatEvents.LEAVE_CHAT)
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: LeaveChatData,
  ) {
    try {
      const userProfileId = client.userProfileId;

      if (userProfileId) {
        await client.leave(data.chatId);
        this.logger.log(`User ${userProfileId} left chat ${data.chatId}`);

        client.emit(ChatEvents.LEFT_CHAT, { chatId: data.chatId });
        client.to(data.chatId).emit(ChatEvents.USER_LEFT, {
          userProfileId,
          chatId: data.chatId,
        });
      }
    } catch (error) {
      this.logger.error('Error leaving chat:', error);
      client.emit(ChatEvents.LEAVE_CHAT_ERROR, {
        message: 'Failed to leave chat',
      });
    }
  }

  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageData,
  ) {
    try {
      const userProfileId = client.userProfileId;

      if (!userProfileId) {
        client.emit(ChatEvents.SEND_MESSAGE_ERROR, {
          message: 'User not authenticated',
        });
        return;
      }

      const hasAccess = await this.verifyChatAccess(data.chatId, userProfileId);
      if (!hasAccess) {
        client.emit(ChatEvents.SEND_MESSAGE_ERROR, {
          message: 'Access denied to this chat',
        });
        return;
      }

      const message = {
        senderId: userProfileId,
        content: data.content,
        timestamp: new Date(),
      };

      this.broadcastToChat(data.chatId, ChatEvents.NEW_MESSAGE, {
        chatId: data.chatId,
        message,
      });

      this.logger.log(
        `Message sent in chat ${data.chatId} by user ${userProfileId}`,
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit(ChatEvents.SEND_MESSAGE_ERROR, {
        message: 'Failed to send message',
      });
    }
  }

  private async verifyChatAccess(
    chatId: string,
    userProfileId: string,
  ): Promise<boolean> {
    try {
      const chat = await this.chatRepository.findOne({
        where: { id: chatId },
        relations: ['members'],
      });

      if (!chat) return false;

      const isMember = chat.members.some(
        (member) => member.id === userProfileId,
      );

      return isMember;
    } catch (error) {
      this.logger.error('Error verifying chat access:', error);
      return false;
    }
  }

  private extractUserProfileIdFromToken(token: string): string | null {
    const decoded = this.jwtService.verify<Claims>(token, {
      secret: process.env.JWT_SIGNING_KEY_SECRET,
    });
    return decoded.userProfileId;
  }

  public broadcastToChat(
    chatId: string,
    event: ChatEvents,
    data: NewMessageEvent,
  ) {
    this.server.to(chatId).emit(event, data);
  }

  public sendToUser(userProfileId: string, event: string, data: any) {
    const userSockets = this.userSockets.get(userProfileId);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  public isUserOnline(userProfileId: string): boolean {
    const userSockets = this.userSockets.get(userProfileId);
    return userSockets ? userSockets.size > 0 : false;
  }
}
