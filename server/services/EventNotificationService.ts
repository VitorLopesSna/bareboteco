import type { Response } from 'express';
import type { IEventNotificationService } from './interfaces/IEventNotificationService.ts';

interface SSEClient {
  id: number;
  res: Response;
}

/**
 * Single Responsibility: Real-time Server-Sent Events (SSE) connection and notification dispatching.
 */
export class EventNotificationService implements IEventNotificationService {
  private clients: SSEClient[] = [];
  private nextClientId = 1;

  registerClient(res: Response): number {
    const clientId = this.nextClientId++;
    this.clients.push({ id: clientId, res });

    // Initial keepalive ping
    try {
      res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: { clientId } })}\n\n`);
    } catch {
      // client error
    }

    return clientId;
  }

  unregisterClient(clientId: number): void {
    this.clients = this.clients.filter(c => c.id !== clientId);
  }

  broadcast(type: string, data: any): void {
    const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
    this.clients.forEach(client => {
      try {
        client.res.write(payload);
      } catch {
        // failed or disconnected client
      }
    });
  }
}
