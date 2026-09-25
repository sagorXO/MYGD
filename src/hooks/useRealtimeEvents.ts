"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { RealtimeEventType } from "@/lib/events";

interface UseRealtimeEventsOptions {
  channel?: string;
  onEvent?: (eventType: RealtimeEventType | string, data: any) => void;
  enabled?: boolean;
  edgeGatewayUrl?: string;
}

export function useRealtimeEvents({
  channel = "all",
  onEvent,
  enabled = true,
  edgeGatewayUrl = process.env.NEXT_PUBLIC_MGD_EDGE_URL || "http://mgd-edge.local:8080/events",
}: UseRealtimeEventsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionTier, setConnectionTier] = useState<"EDGE" | "CLOUD" | "OFFLINE">("OFFLINE");
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const onEventRef = useRef(onEvent);
  const isMountedRef = useRef(true);

  // Keep callback reference updated without triggering re-connects
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const attachEventListeners = useCallback((es: EventSource, tier: "EDGE" | "CLOUD") => {
    es.onopen = () => {
      if (!isMountedRef.current) return;
      setIsConnected(true);
      setConnectionTier(tier);
      retryCountRef.current = 0;
    };

    // Generic Message Handler
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (onEventRef.current) {
          onEventRef.current("MESSAGE", data);
        }
      } catch {
        // Plain text message
      }
    };

    // Specific Realtime Event Listeners
    const eventTypes: (RealtimeEventType | "CONNECTED" | "HEARTBEAT")[] = [
      "ORDER_CREATED",
      "TICKET_UPDATED",
      "STOCK_CHANGED",
      "PRICE_UPDATED",
      "MENU_BOARD_PULSE",
      "MENU_BOARD_UPDATED",
      "CONNECTED",
      "HEARTBEAT",
    ];

    eventTypes.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (type === "HEARTBEAT") {
            setLastHeartbeat(data.time || new Date().toISOString());
          }
          if (onEventRef.current) {
            onEventRef.current(type, data);
          }
        } catch (err) {
          console.error(`[useRealtimeEvents] Failed to parse ${type} event:`, err);
        }
      });
    });
  }, []);

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Tier 1: Attempt In-Store Local Edge Gateway first if configured
    let triedEdge = false;
    const cloudUrl = `/api/events?channel=${encodeURIComponent(channel)}`;

    const attemptCloudFallback = () => {
      try {
        const cloudEs = new EventSource(cloudUrl);
        eventSourceRef.current = cloudEs;
        attachEventListeners(cloudEs, "CLOUD");

        cloudEs.onerror = () => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
          setConnectionTier("OFFLINE");
          cloudEs.close();
          eventSourceRef.current = null;

          // Exponential backoff retry (1s, 2s, 4s, max 10s)
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
          retryCountRef.current += 1;

          setTimeout(() => {
            if (enabled && isMountedRef.current) {
              connect();
            }
          }, delay);
        };
      } catch (err) {
        console.error("[useRealtimeEvents] Cloud fallback connection failed:", err);
        setIsConnected(false);
        setConnectionTier("OFFLINE");
      }
    };

    if (edgeGatewayUrl && edgeGatewayUrl.startsWith("http")) {
      try {
        triedEdge = true;
        const edgeEs = new EventSource(`${edgeGatewayUrl}?channel=${encodeURIComponent(channel)}`);
        eventSourceRef.current = edgeEs;
        attachEventListeners(edgeEs, "EDGE");

        edgeEs.onerror = () => {
          // If local edge fails (e.g. offline gateway), immediately fallback to cloud endpoint
          edgeEs.close();
          eventSourceRef.current = null;
          attemptCloudFallback();
        };
      } catch {
        attemptCloudFallback();
      }
    } else {
      attemptCloudFallback();
    }
  }, [channel, enabled, edgeGatewayUrl, attachEventListeners]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      setConnectionTier("OFFLINE");
    };
  }, [connect]);

  return {
    isConnected,
    connectionTier,
    lastHeartbeat,
  };
}
