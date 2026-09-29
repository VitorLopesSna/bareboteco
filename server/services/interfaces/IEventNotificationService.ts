import type { Response } from 'express';

export interface IEventPublisher {
  broadcast(type: string, data: any): void;
}

export interface IEventSubscriberManager {
  registerClient(res: Response): number;
  unregisterClient(clientId: number): void;
}

export interface IEventNotificationService extends IEventPublisher, IEventSubscriberManager {}
