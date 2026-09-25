// MY GERMAN DÖNER — Server-Sent Events (SSE) Route
// GET /api/events?channel=kds|display|boards|pos|admin|all

import { NextRequest } from "next/server";
import { eventBroker, formatSSEMessage } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel") || "all";

  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial Connection Handshake
      controller.enqueue(
        encoder.encode(
          formatSSEMessage("CONNECTED", {
            status: "connected",
            channel,
            connectedAt: new Date().toISOString(),
          })
        )
      );

      // 2. Subscribe to EventBroker on specified channel
      unsubscribe = eventBroker.subscribe(channel, (eventData) => {
        try {
          const eventType = (eventData as any).type || "MESSAGE";
          controller.enqueue(encoder.encode(formatSSEMessage(eventType, eventData)));
        } catch (err) {
          console.error("[SSE Stream] Failed to enqueue event:", err);
        }
      });

      // 3. Heartbeat Keep-Alive (every 15 seconds)
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              formatSSEMessage("HEARTBEAT", {
                time: new Date().toISOString(),
                subscribers: eventBroker.getSubscriberCount(),
              })
            )
          );
        } catch {
          // Stream might be closed
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 15000);
    },

    cancel() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    },
  });

  // Handle client abort
  req.signal.addEventListener("abort", () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, max-age=0",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx proxy buffering
    },
  });
}
