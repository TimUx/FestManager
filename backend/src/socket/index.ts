import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { corsPolicy } from '../middleware/corsPolicy';
import { logger } from '../utils/logger';
import type { AuthPayload } from '../middleware/auth';
import { orderRepository } from '../repositories';
import { tenantContext } from '../platform/bootstrap';

let io: Server | null = null;

type SocketData = {
  user?: AuthPayload;
};

function isStaff(user?: AuthPayload): boolean {
  return Boolean(user && (user.role === 'ADMIN' || user.role === 'STAFF'));
}

function scopedRoom(room: string): string {
  const tenantId = tenantContext.id();
  if (!tenantId) return room;
  return `tenant:${tenantId}:${room}`;
}

async function verifyOrderAccess(
  lookupToken: string,
  lastName?: string,
  user?: AuthPayload
): Promise<boolean> {
  if (isStaff(user)) return true;
  if (!lastName?.trim()) return false;
  const order = await orderRepository.findByLookupToken(lookupToken);
  if (!order?.customer) return false;
  return order.customer.lastName.toLowerCase() === lastName.trim().toLowerCase();
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: corsPolicy.socketOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        (socket.data as SocketData).user = jwt.verify(token, config.jwt.secret) as AuthPayload;
      } catch {
        // Gast-Verbindung ohne Token erlaubt (für Bestellstatus mit Nachname)
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const data = socket.data as SocketData;
    logger.info(`Socket verbunden: ${socket.id}${data.user ? ` (${data.user.role})` : ''}`);

    socket.on('join:event', async (eventId: string, callback?: (err?: string) => void) => {
      if (!isStaff(data.user)) {
        callback?.('Nicht autorisiert');
        return;
      }
      socket.join(scopedRoom(`event:${eventId}`));
      socket.join(scopedRoom(`staff:event:${eventId}`));
      logger.info(`Socket ${socket.id} joined ${scopedRoom(`staff:event:${eventId}`)}`);
      callback?.();
    });

    socket.on(
      'join:order',
      async (payload: string | { lookupToken: string; lastName?: string }, callback?: (err?: string) => void) => {
        const lookupToken = typeof payload === 'string' ? payload : payload.lookupToken;
        const lastName = typeof payload === 'string' ? undefined : payload.lastName;
        const ok = await verifyOrderAccess(lookupToken, lastName, data.user);
        if (!ok) {
          callback?.('Nicht autorisiert');
          return;
        }
        const order = await orderRepository.findByLookupToken(lookupToken);
        if (!order) {
          callback?.('Nicht autorisiert');
          return;
        }
        socket.join(scopedRoom(`order:${order.id}`));
        callback?.();
      }
    );

    socket.on('join:pickup-board', async (eventId: string, callback?: (err?: string) => void) => {
      socket.join(scopedRoom(`pickup:${eventId}`));
      callback?.();
    });

    socket.on('leave:order', (orderId: string) => {
      socket.leave(scopedRoom(`order:${orderId}`));
    });

    socket.on('disconnect', () => {
      logger.info(`Socket getrennt: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO nicht initialisiert');
  return io;
}

export function emitOrderUpdate(eventId: string, order: unknown): void {
  if (!io) return;
  io.to(scopedRoom(`staff:event:${eventId}`)).emit('order:updated', order);
  io.to(scopedRoom(`pickup:${eventId}`)).emit('order:updated', order);
  const orderData = order as { id: string };
  io.to(scopedRoom(`order:${orderData.id}`)).emit('order:updated', order);
}

export function emitOrderCreated(eventId: string, order: unknown): void {
  if (!io) return;
  io.to(scopedRoom(`staff:event:${eventId}`)).emit('order:created', order);
}

export function emitEventUpdate(event: unknown): void {
  if (!io) return;
  const tenantId = tenantContext.id();
  if (tenantId) {
    io.to(scopedRoom('broadcast')).emit('event:updated', event);
  } else {
    io.emit('event:updated', event);
  }
}

export function emitFoodItemsUpdate(eventId: string, items: unknown): void {
  if (!io) return;
  io.to(scopedRoom(`staff:event:${eventId}`)).emit('fooditems:updated', items);
}

export function emitClubUpdate(club: unknown): void {
  if (!io) return;
  const tenantId = tenantContext.id();
  if (tenantId) {
    io.to(scopedRoom('broadcast')).emit('club:updated', club);
  } else {
    io.emit('club:updated', club);
  }
}

export function emitPrintJob(eventId: string, job: unknown): void {
  if (!io) return;
  io.to(scopedRoom(`staff:event:${eventId}`)).emit('print:job', job);
}
