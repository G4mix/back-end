import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from 'src/entities/chat.entity';
import { JwtService } from '@nestjs/jwt';
import { Claims } from 'src/jwt/jwt.strategy';
import { IsString, IsUUID } from 'class-validator';
import { safeSave } from '../utils/safe-save.util';

interface AuthenticatedSocket extends Socket {
  userProfileId?: string;
  currentChatId?: string;
}

export class JoinChatData {
  @IsUUID()
  chatId: string;

  @IsString()
  token: string;
}

export class SendMessageData {
  @IsString()
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
    origin: process.env.FRONTEND_URL!,
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

    client.currentChatId = undefined;

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
    @MessageBody(new ValidationPipe({ transform: true })) data: JoinChatData,
  ) {
    try {
      const userProfileId = this.extractUserProfileIdFromToken(data.token);

      if (!userProfileId) {
        client.emit(ChatEvents.JOIN_CHAT_ERROR, { message: 'Invalid token' });
        return;
      }

      const chat = await this.getChat(data.chatId);
      if (!chat) {
        client.emit(ChatEvents.JOIN_CHAT_ERROR, { message: 'Chat not found' });
        return;
      }

      const hasAccess = this.verifyChatAccess(chat, userProfileId);
      if (!hasAccess) {
        client.emit(ChatEvents.JOIN_CHAT_ERROR, {
          message: 'Access denied to this chat',
        });
        return;
      }

      client.userProfileId = userProfileId;
      client.currentChatId = data.chatId;

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
  async handleLeaveChat(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      const userProfileId = client.userProfileId;
      const chatId = client.currentChatId;

      if (userProfileId && chatId) {
        await client.leave(chatId);
        client.currentChatId = undefined;
        this.logger.log(`User ${userProfileId} left chat ${chatId}`);

        client.emit(ChatEvents.LEFT_CHAT, { chatId: chatId });
        client.to(chatId).emit(ChatEvents.USER_LEFT, {
          userProfileId,
          chatId: chatId,
        });
      } else {
        client.emit(ChatEvents.LEAVE_CHAT_ERROR, {
          message: 'User not authenticated or not in any chat',
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
    @MessageBody(new ValidationPipe({ transform: true })) data: SendMessageData,
  ) {
    try {
      const userProfileId = client.userProfileId;
      const chatId = client.currentChatId;

      if (!userProfileId || !chatId) {
        client.emit(ChatEvents.SEND_MESSAGE_ERROR, {
          message: 'User not authenticated or not in a chat',
        });
        return;
      }

      const chat = await this.getChat(chatId);
      if (!chat) {
        client.emit(ChatEvents.SEND_MESSAGE_ERROR, {
          message: 'Chat not found',
        });
        return;
      }

      const hasAccess = this.verifyChatAccess(chat, userProfileId);
      if (!hasAccess) {
        client.emit(ChatEvents.SEND_MESSAGE_ERROR, {
          message: 'Access denied to this chat',
        });
        return;
      }

      const newMessage = await this.sendMessage(
        chat,
        userProfileId,
        data.content,
      );

      this.broadcastToChat(chatId, ChatEvents.NEW_MESSAGE, {
        chatId: chatId,
        message: newMessage,
      });

      this.logger.log(
        `Message sent in chat ${chatId} by user ${userProfileId}`,
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit(ChatEvents.SEND_MESSAGE_ERROR, {
        message: 'Failed to send message',
      });
    }
  }
  private async getChat(chatId: string): Promise<Chat | null> {
    return await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['members'],
    });
  }
  private verifyChatAccess(chat: Chat, userProfileId: string): boolean {
    try {
      const isMember = chat.members.some(
        (member) => member.id === userProfileId,
      );

      return isMember;
    } catch (error) {
      this.logger.error('Error verifying chat access:', error);
      return false;
    }
  }
  private async sendMessage(
    chat: Chat,
    userProfileId: string,
    content: string,
  ): Promise<{ senderId: string; content: string; timestamp: Date }> {
    const newMessage = {
      senderId: userProfileId,
      content: content,
      timestamp: new Date(),
    };

    const updatedMessages = [...(chat.messages || []), newMessage];

    await safeSave(this.chatRepository, {
      ...chat,
      messages: updatedMessages,
    });

    return newMessage;
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
}
