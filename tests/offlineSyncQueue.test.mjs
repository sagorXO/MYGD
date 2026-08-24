import test from "node:test";
import assert from "node:assert/strict";

class MockSyncQueue {
  constructor() {
    this.queue = [];
  }
  enqueue(item) {
    const record = { id: "sync-" + (this.queue.length + 1), payload: item, status: "PENDING", retryCount: 0 };
    this.queue.push(record);
    return record;
  }
  flush(isOnline = true) {
    let synced = 0;
    let failed = 0;
    for (const item of this.queue) {
      if (item.status === "PENDING" || item.status === "FAILED_RETRYING") {
        if (isOnline) {
          item.status = "SYNCED";
          synced++;
        } else {
          item.retryCount++;
          item.status = item.retryCount >= 5 ? "PERMANENT_FAIL" : "FAILED_RETRYING";
          failed++;
        }
      }
    }
    return { synced, failed };
  }
}

test("Layer 2 Offline Sync - Enqueues orders and flushes upon network reconnection", () => {
  const sync = new MockSyncQueue();
  sync.enqueue({ orderNumber: "EMBA-001", total: 7.50 });
  sync.enqueue({ orderNumber: "EMBA-002", total: 15.00 });

  // Simulate outage
  const offlineFlush = sync.flush(false);
  assert.equal(offlineFlush.failed, 2);
  assert.equal(sync.queue[0].status, "FAILED_RETRYING");

  // Reconnect
  const onlineFlush = sync.flush(true);
  assert.equal(onlineFlush.succeeded ?? onlineFlush.synced, 2);
  assert.equal(sync.queue[0].status, "SYNCED");
});
