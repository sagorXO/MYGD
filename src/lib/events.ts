// MY GERMAN DÖNER — Real-Time Event Dispatcher & Broker
// Sub-15ms in-memory event bus with SSE streaming support across all store screens

export type RealtimeChannel = "kds" | "display" | "boards" | "pos" | "admin" | "all" | string;

export type RealtimeEventType =
  | "ORDER_CREATED"
  | "TICKET_UPDATED"
  | "STOCK_CHANGED"
  | "PRICE_UPDATED"
  | "MENU_BOARD_PULSE"
  | "MENU_BOARD_UPDATED"
  | "HEARTBEAT"
  | "PING"
  | "STAFF_PUNCHED";

export interface RealtimeEvent<T = any> {
  type: RealtimeEventType;
  channel?: string;
  data: T;
  timestamp: string;
}

type EventListener = (event: RealtimeEvent) => void;

class EventBroker {
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * Subscribe to events on a specific channel.
   * Special channel "*" or "all" receives events from all channels.
   */
  subscribe(channel: RealtimeChannel, listener: EventListener): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(listener);

    return () => {
      const channelSet = this.listeners.get(channel);
      if (channelSet) {
        channelSet.delete(listener);
        if (channelSet.size === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }

  /**
   * Publish an event to subscribers on the specified channel and global "all" listeners.
   */
  publish<T = any>(channel: RealtimeChannel, eventData: T | { type: RealtimeEventType; [key: string]: any }): void {
    const timestamp = new Date().toISOString();
    const event: RealtimeEvent = {
      type: (eventData as any).type || "ORDER_CREATED",
      channel,
      data: eventData,
      timestamp,
    };

    // 1. Notify specific channel subscribers
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      for (const listener of channelListeners) {
        try {
          listener(event.data || event);
        } catch (err) {
          console.error(`[EventBroker] Listener error on channel ${channel}:`, err);
        }
      }
    }

    // 2. Notify wildcard "all" / "*" subscribers
    if (channel !== "all" && channel !== "*") {
      const globalListeners = this.listeners.get("all") || this.listeners.get("*");
      if (globalListeners) {
        for (const listener of globalListeners) {
          try {
            listener(event.data || event);
          } catch (err) {
            console.error(`[EventBroker] Global listener error:`, err);
          }
        }
      }
    }
  }

  /**
   * Get active subscriber count across all channels.
   */
  getSubscriberCount(): number {
    let total = 0;
    for (const set of this.listeners.values()) {
      total += set.size;
    }
    return total;
  }
}

// Global Singleton Instance across Node.js runtime
declare global {
  var __mygd_event_broker: EventBroker | undefined;
}

export const eventBroker: EventBroker =
  globalThis.__mygd_event_broker || (globalThis.__mygd_event_broker = new EventBroker());

/**
 * Format a typed event for Server-Sent Events (text/event-stream).
 */
export function formatSSEMessage(eventType: string, data: any): string {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return `event: ${eventType}\ndata: ${payload}\n\n`;
}
