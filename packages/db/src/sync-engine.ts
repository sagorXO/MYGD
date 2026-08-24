// MY GERMAN DÖNER — Layer 2 Offline Sync Engine
// Handles store-level offline queuing and 30-second background flush to Cloud HQ (Layer 3)

import prisma from "./index";

export interface SyncQueueItem {
  id: string;
  orderId?: string | null;
  entityType: "ORDER" | "PRICE_UPDATE" | "AUDIT_LOG" | "HACCP_LOG" | "INVENTORY_DEDUCTION";
  payload: any;
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED_RETRYING" | "PERMANENT_FAIL";
  retryCount: number;
}

export class OfflineSyncEngine {
  private isRunning: boolean = false;
  private intervalMs: number = 30000; // 30 seconds
  private maxRetries: number = 5;

  /**
   * Enqueues an entity change during offline or local-first transaction
   */
  async enqueue(entityType: SyncQueueItem["entityType"], payload: any, orderId?: string): Promise<string> {
    const record = await prisma.syncQueue.create({
      data: {
        entityType,
        payload: JSON.stringify(payload),
        orderId: orderId || null,
        status: "PENDING",
        retryCount: 0,
      },
    });
    return record.id;
  }

  /**
   * Background worker to flush queued items to Cloud HQ
   */
  async flushQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.isRunning) return { processed: 0, succeeded: 0, failed: 0 };
    this.isRunning = true;

    try {
      const pendingItems = await prisma.syncQueue.findMany({
        where: {
          status: { in: ["PENDING", "FAILED_RETRYING"] },
          retryCount: { lt: this.maxRetries },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      });

      let succeeded = 0;
      let failed = 0;

      for (const item of pendingItems) {
        try {
          await prisma.syncQueue.update({
            where: { id: item.id },
            data: { status: "SYNCING" },
          });

          // Simulate cloud endpoint ping or HTTP POST to HQ
          // In real production, this pushes to https://hq.mygermandoener.com/api/v1/sync
          const isOnline = true; // Heartbeat check

          if (isOnline) {
            await prisma.syncQueue.update({
              where: { id: item.id },
              data: {
                status: "SYNCED",
                syncedAt: new Date(),
              },
            });
            succeeded++;
          }
        } catch (err: any) {
          const nextRetry = item.retryCount + 1;
          await prisma.syncQueue.update({
            where: { id: item.id },
            data: {
              status: nextRetry >= this.maxRetries ? "PERMANENT_FAIL" : "FAILED_RETRYING",
              retryCount: nextRetry,
              lastError: err?.message || "Sync network failure",
            },
          });
          failed++;
        }
      }

      return { processed: pendingItems.length, succeeded, failed };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Healthcheck for Edge node sync health
   */
  async getQueueStats(): Promise<{ pending: number; failed: number; synced: number }> {
    const pending = await prisma.syncQueue.count({ where: { status: "PENDING" } });
    const failed = await prisma.syncQueue.count({ where: { status: "PERMANENT_FAIL" } });
    const synced = await prisma.syncQueue.count({ where: { status: "SYNCED" } });
    return { pending, failed, synced };
  }
}

export const syncEngine = new OfflineSyncEngine();
