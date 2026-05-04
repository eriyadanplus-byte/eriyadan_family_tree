import { EventEmitter } from 'events';

export type BusEvent =
  | { kind: 'message'; threadId: string; payload: object }
  | { kind: 'thread_updated'; threadId: string; payload: object }
  | { kind: 'new_thread'; threadId: string; payload: object }
  | { kind: 'grant_revoked'; editorUserId: string };

// Single-process in-memory pub/sub.
// When migrating to Cloudflare Workers: replace with Durable Objects or a queue.
class HelpBus extends EventEmitter {
  emit(event: 'help', data: BusEvent): boolean {
    return super.emit('help', data);
  }

  onMessage(listener: (data: BusEvent) => void): this {
    return this.on('help', listener);
  }

  offMessage(listener: (data: BusEvent) => void): this {
    return this.off('help', listener);
  }

  publish(data: BusEvent): void {
    this.emit('help', data);
  }
}

// Singleton shared across all in-process requests
const bus = new HelpBus();
bus.setMaxListeners(500);

export default bus;
