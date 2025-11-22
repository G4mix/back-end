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
  SEND_MESSAGE = 'send_message',
  ERROR = 'error',
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

  async handleConnection(client: AuthenticatedSocket) {
    const { token, chatId } = client.handshake.query;

    try {
      const validationPipe = new ValidationPipe({ transform: true });
      const data = (await validationPipe.transform(
        { token, chatId },
        { metatype: JoinChatData, type: 'body' },
      )) as JoinChatData;

      if (!data) throw new Error('UNAUTHORIZED');

      const userProfileId = this.extractUserProfileIdFromToken(data.token);
      if (!userProfileId) throw new Error('UNAUTHORIZED');

      const chat = await this.getChat(data.chatId);
      if (!chat) throw new Error('UNAUTHORIZED');

      const hasAccess = this.verifyChatAccess(chat, userProfileId);
      if (!hasAccess) throw new Error('UNAUTHORIZED');

      client.userProfileId = userProfileId;
      client.currentChatId = data.chatId;

      if (!this.userSockets.has(userProfileId)) {
        this.userSockets.set(userProfileId, new Set());
      }
      this.userSockets.get(userProfileId)!.add(client.id);

      client.join(data.chatId);
      this.logger.log(`User ${userProfileId} joined chat ${data.chatId}`);

      this.server.to(data.chatId).emit(ChatEvents.USER_JOINED, {
        userProfileId,
        chatId: data.chatId,
      });
    } catch (error) {
      this.logger.error('Error connecting to chat:', error);
      client.emit(ChatEvents.ERROR, {
        type: 'JOIN_CHAT_ERROR',
        message: error.message || 'UNAUTHORIZED',
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userProfileId = client.userProfileId;
    const chatId = client.currentChatId;

    if (userProfileId && chatId) {
      await client.leave(chatId);
      this.logger.log(`User ${userProfileId} left chat ${chatId}`);

      client.to(chatId).emit(ChatEvents.USER_LEFT, {
        userProfileId,
        chatId: chatId,
      });
    }

    if (userProfileId) {
      const userSockets = this.userSockets.get(userProfileId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(userProfileId);
        }
      }
    }

    client.currentChatId = undefined;
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
        client.emit(ChatEvents.ERROR, {
          type: 'SEND_MESSAGE_ERROR',
          message: 'User not authenticated or not in a chat',
        });
        return;
      }

      const chat = await this.getChat(chatId);
      if (!chat) {
        client.emit(ChatEvents.ERROR, {
          type: 'SEND_MESSAGE_ERROR',
          message: 'Chat not found',
        });
        return;
      }

      const hasAccess = this.verifyChatAccess(chat, userProfileId);
      if (!hasAccess) {
        client.emit(ChatEvents.ERROR, {
          type: 'SEND_MESSAGE_ERROR',
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
      client.emit(ChatEvents.ERROR, {
        type: 'SEND_MESSAGE_ERROR',
        message: 'Failed to send message',
      });
    }
  }
  private async getChat(chatId: string): Promise<Chat | null> {
    return await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['members', 'project'],
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
