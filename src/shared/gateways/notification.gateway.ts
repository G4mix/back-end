import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import {
  Notification,
  NotificationDto,
  NotificationType,
  RelatedEntityType,
} from 'src/entities/notification.entity';
import { User } from 'src/entities/user.entity';
import { CollaborationRequest } from 'src/entities/collaboration-request.entity';
import { Claims } from 'src/jwt/jwt.strategy';
import { Repository } from 'typeorm';

export enum NotificationEvents {
  NEW_NOTIFICATION = 'new_notification',
  ERROR = 'error',
}

interface SseConnection {
  response: Response;
  userId: string;
}

@Injectable()
export class NotificationGateway implements OnModuleDestroy {
  private readonly logger = new Logger(this.constructor.name);
  private userConnections = new Map<string, Set<SseConnection>>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
    private readonly jwtService: JwtService,
  ) {
    this.startHeartbeat();
  }

  async handleConnection(
    response: Response,
    token: string | null,
  ): Promise<void> {
    try {
      if (!token || typeof token !== 'string') {
        this.sendError(response, 'UNAUTHORIZED', 'Missing or invalid token');
        return;
      }

      const userId = await this.authenticateUser(token);
      if (!userId) {
        this.sendError(response, 'UNAUTHORIZED', 'Authentication failed');
        return;
      }

      this.setupSseHeaders(response);

      const connection: SseConnection = { response, userId };

      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connection);

      this.logger.log(`User ${userId} connected to SSE notifications`);
      this.logger.log(
        `Total connections for user ${userId}: ${this.userConnections.get(userId)!.size}`,
      );
      this.logger.log(`Total users connected: ${this.userConnections.size}`);

      this.sendEvent(response, 'connected', { userId });

      response.on('close', () => {
        this.handleDisconnection(connection);
      });

      response.on('error', () => {
        this.handleDisconnection(connection);
      });
    } catch (error) {
      this.logger.error('Error connecting to SSE notifications:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'UNAUTHORIZED';
      this.sendError(response, 'CONNECTION_ERROR', errorMessage);
    }
  }

  private handleDisconnection(connection: SseConnection): void {
    const { userId } = connection;
    const userConnections = this.userConnections.get(userId);

    if (userConnections) {
      userConnections.delete(connection);
      if (userConnections.size === 0) {
        this.userConnections.delete(userId);
      }
    }

    this.logger.log(`User ${userId} disconnected from SSE notifications`);
  }

  private async authenticateUser(token: string): Promise<string | null> {
    try {
      const payload = this.jwtService.verify<Claims>(token, {
        secret: process.env.JWT_SIGNING_KEY_SECRET,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) return null;

      return payload.userProfileId;
    } catch (error) {
      this.logger.error('Authentication failed:', error);
      return null;
    }
  }

  private setupSseHeaders(response: Response): void {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
  }

  private sendEvent(response: Response, event: string, data: any): void {
    const eventData = JSON.stringify(data);
    response.write(`event: ${event}\ndata: ${eventData}\n\n`);
  }

  private sendError(response: Response, type: string, message: string): void {
    const errorData = JSON.stringify({ type, message });
    response.write(
      `event: ${NotificationEvents.ERROR}\ndata: ${errorData}\n\n`,
    );
    response.end();
  }

  public sendNotificationToUser(
    userId: string,
    notification: NotificationDto,
  ): void {
    this.logger.log(
      `Attempting to send notification ${notification.id} to user ${userId}`,
    );
    this.logger.log(
      `Active connections: ${Array.from(this.userConnections.keys()).join(', ')}`,
    );
    this.logger.log(`Total users connected: ${this.userConnections.size}`);

    const connections = this.userConnections.get(userId);
    if (!connections || connections.size === 0) {
      this.logger.warn(
        `No connections found for user ${userId}. Notification ${notification.id} not sent.`,
      );
      this.logger.log(
        `Available user IDs: ${Array.from(this.userConnections.keys()).join(', ')}`,
      );
      return;
    }

    this.logger.log(
      `Found ${connections.size} connection(s) for user ${userId}`,
    );

    const eventData = JSON.stringify({ notification });
    const sseMessage = `event: ${NotificationEvents.NEW_NOTIFICATION}\ndata: ${eventData}\n\n`;

    this.logger.log(`SSE message: ${sseMessage.substring(0, 200)}...`);

    const deadConnections: SseConnection[] = [];

    for (const connection of connections) {
      try {
        connection.response.write(sseMessage);
        this.logger.log(
          `Successfully wrote notification ${notification.id} to connection for user ${userId}`,
        );
      } catch (_error) {
        this.logger.warn(
          `Failed to send notification to user ${userId}, connection may be closed`,
          _error,
        );
        deadConnections.push(connection);
      }
    }

    for (const deadConnection of deadConnections) {
      this.handleDisconnection(deadConnection);
    }

    this.logger.log(`Notification sent to user ${userId}: ${notification.id}`);
  }

  public isUserConnected(userId: string): boolean {
    return (
      this.userConnections.has(userId) &&
      this.userConnections.get(userId)!.size > 0
    );
  }

  async createAndSendNotification(
    userProfileId: string,
    type: NotificationType,
    title: string,
    message: string,
    actorProfileId?: string | null,
    relatedEntityId?: string | null,
    relatedEntityType?: RelatedEntityType | null,
  ): Promise<Notification | null> {
    const notificationEntity = this.notificationRepository.create({
      userProfileId,
      type,
      title,
      message,
      readAt: null,
      actorProfileId: actorProfileId || null,
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
    });
    const notification =
      await this.notificationRepository.save(notificationEntity);
    if (!notification) return null;

    const notificationWithRelations = await this.notificationRepository.findOne(
      {
        where: { id: notification.id },
        relations: ['actorProfile', 'actorProfile.user'],
      },
    );

    let ideaTitle: string | undefined;
    let ideaId: string | undefined;
    let requesterId: string | undefined;

    if (
      relatedEntityType === RelatedEntityType.COLLABORATION_REQUEST &&
      relatedEntityId
    ) {
      const collaborationRequest =
        await this.collaborationRequestRepository.findOne({
          where: { id: relatedEntityId },
          relations: ['idea'],
        });
      if (collaborationRequest) {
        ideaTitle = collaborationRequest.idea.title;
        ideaId = collaborationRequest.ideaId;
        requesterId = collaborationRequest.requesterId;
      }
    }

    const notificationDto = notificationWithRelations
      ? notificationWithRelations.toDto(ideaTitle, ideaId, requesterId)
      : notification.toDto(ideaTitle, ideaId, requesterId);

    this.logger.log(
      `Sending notification ${notificationDto.id} to userProfileId: ${userProfileId}`,
    );
    this.logger.log(
      `Is user connected? ${this.isUserConnected(userProfileId)}`,
    );

    this.sendNotificationToUser(userProfileId, notificationDto);

    return notificationWithRelations || notification;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [_userId, connections] of this.userConnections.entries()) {
        const deadConnections: SseConnection[] = [];

        for (const connection of connections) {
          try {
            connection.response.write(': heartbeat\n\n');
          } catch (_error) {
            deadConnections.push(connection);
          }
        }

        for (const deadConnection of deadConnections) {
          this.handleDisconnection(deadConnection);
        }
      }
    }, 30000);
  }

  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public closeAllConnections(): void {
    for (const [_userId, connections] of this.userConnections.entries()) {
      for (const connection of connections) {
        try {
          if (
            !connection.response.destroyed &&
            !connection.response.writableEnded
          ) {
            connection.response.end();
          }
        } catch (_error) {
          this.logger.warn(
            `Failed to close connection for user ${_userId}, connection may be closed`,
          );
        }
      }
    }
    this.userConnections.clear();
  }

  public shutdown(): void {
    this.stopHeartbeat();
    this.closeAllConnections();
  }

  onModuleDestroy(): void {
    this.shutdown();
  }
}
