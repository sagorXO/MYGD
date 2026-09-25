// MY GERMAN DÖNER — Resilient Raw TCP Port 9100 Print Spooler
import net from "node:net";
import {
  PrinterStation,
  PrinterConfig,
  PrintJobResult,
  ThermalChitPayload,
  ThermalChitItem,
} from "./printer.schema";
import { buildIndoorChit, buildGrillChit } from "./escpos-encoder";

interface QueuedPrintJob {
  id: string;
  station: "INDOOR" | "GRILL";
  buffer: Buffer;
  config: PrinterConfig;
  attempts: number;
  maxAttempts: number;
  addedAt: number;
}

export class TcpPrintSpooler {
  private queue: QueuedPrintJob[] = [];
  private isProcessing: boolean = false;
  private retryIntervalMs: number = 5000;
  private timer: NodeJS.Timeout | null = null;

  private defaultConfigs: Record<"INDOOR" | "GRILL", PrinterConfig> = {
    INDOOR: {
      host: process.env.PRINTER_INDOOR_IP || "192.168.1.101",
      port: parseInt(process.env.PRINTER_INDOOR_PORT || "9100", 10),
      timeoutMs: 3000,
    },
    GRILL: {
      host: process.env.PRINTER_GRILL_IP || "192.168.1.102",
      port: parseInt(process.env.PRINTER_GRILL_PORT || "9100", 10),
      timeoutMs: 3000,
    },
  };

  constructor() {
    this.startQueueWorker();
  }

  public setPrinterConfig(station: "INDOOR" | "GRILL", config: Partial<PrinterConfig>) {
    this.defaultConfigs[station] = {
      ...this.defaultConfigs[station],
      ...config,
    };
  }

  public getPrinterConfig(station: "INDOOR" | "GRILL"): PrinterConfig {
    return this.defaultConfigs[station];
  }

  /**
   * Raw TCP transmission over port 9100 with zero unhandled rejection guarantees
   */
  public async sendDirect(
    buffer: Buffer,
    station: "INDOOR" | "GRILL",
    config: PrinterConfig = this.defaultConfigs[station]
  ): Promise<PrintJobResult> {
    const { host, port, timeoutMs = 3000 } = config;

    return new Promise<PrintJobResult>((resolve) => {
      let isSettled = false;
      let bytesWritten = 0;

      const safeResolve = (res: PrintJobResult) => {
        if (!isSettled) {
          isSettled = true;
          resolve(res);
        }
      };

      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);

      socket.on("connect", () => {
        bytesWritten = buffer.length;
        socket.write(buffer, () => {
          socket.end();
        });
      });

      socket.on("close", () => {
        safeResolve({
          success: true,
          station,
          bytesWritten,
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        safeResolve({
          success: false,
          station,
          bytesWritten: 0,
          error: `TCP 9100 socket timeout after ${timeoutMs}ms connecting to ${host}:${port}`,
        });
      });

      socket.on("error", (err: Error) => {
        socket.destroy();
        safeResolve({
          success: false,
          station,
          bytesWritten: 0,
          error: `TCP connection failed on ${host}:${port}: ${err.message}`,
        });
      });

      try {
        socket.connect(port, host);
      } catch (err: any) {
        safeResolve({
          success: false,
          station,
          bytesWritten: 0,
          error: `Immediate socket connection exception: ${err?.message || String(err)}`,
        });
      }
    });
  }

  /**
   * Enqueues print job to resilient offline retry FIFO buffer
   */
  public enqueue(
    buffer: Buffer,
    station: "INDOOR" | "GRILL",
    config: PrinterConfig = this.defaultConfigs[station],
    maxAttempts: number = 5
  ): string {
    const id = `print-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.queue.push({
      id,
      station,
      buffer,
      config,
      attempts: 0,
      maxAttempts,
      addedAt: Date.now(),
    });
    return id;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Route classification: Determines if item goes to INDOOR, GRILL, or BOTH
   */
  public classifyItemStation(item: ThermalChitItem): PrinterStation {
    if (item.stationTarget) {
      return item.stationTarget;
    }
    const name = item.name.toLowerCase();
    const hasMeat =
      name.includes("döner") ||
      name.includes("doner") ||
      name.includes("dürüm") ||
      name.includes("durum") ||
      name.includes("box") ||
      item.meatWeightGrams !== undefined ||
      (item.spiceLevel !== undefined && item.spiceLevel > 1);

    if (hasMeat) return "BOTH";
    return "INDOOR";
  }

  /**
   * High-level dual station order print dispatcher
   */
  public async dispatchDualStationPrint(payload: ThermalChitPayload): Promise<{
    indoorResult: PrintJobResult;
    grillResult: PrintJobResult;
  }> {
    const indoorItems: ThermalChitItem[] = [];
    const grillItems: ThermalChitItem[] = [];

    for (const item of payload.items) {
      const station = this.classifyItemStation(item);
      if (station === "GRILL" || station === "BOTH") {
        grillItems.push({ ...item, stationTarget: "GRILL" });
      }
      if (station === "INDOOR" || station === "BOTH") {
        indoorItems.push({ ...item, stationTarget: "INDOOR" });
      }
    }

    const indoorBuffer = buildIndoorChit(payload, indoorItems);
    const grillBuffer = buildGrillChit(payload, grillItems);

    const [indoorResult, grillResult] = await Promise.all([
      this.sendDirect(indoorBuffer, "INDOOR"),
      this.sendDirect(grillBuffer, "GRILL"),
    ]);

    // If either fails, buffer into retry queue automatically
    if (!indoorResult.success) {
      this.enqueue(indoorBuffer, "INDOOR");
      indoorResult.bufferedForRetry = true;
    }

    if (!grillResult.success) {
      this.enqueue(grillBuffer, "GRILL");
      grillResult.bufferedForRetry = true;
    }

    return { indoorResult, grillResult };
  }

  private startQueueWorker() {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      if (this.isProcessing || this.queue.length === 0) return;
      this.isProcessing = true;

      const job = this.queue[0];
      job.attempts++;

      const res = await this.sendDirect(job.buffer, job.station, job.config);
      if (res.success) {
        this.queue.shift(); // Remove completed job
      } else {
        if (job.attempts >= job.maxAttempts) {
          console.error(`[TcpPrintSpooler] Job ${job.id} exceeded max attempts (${job.maxAttempts}). Dropping.`);
          this.queue.shift();
        }
      }

      this.isProcessing = false;
    }, this.retryIntervalMs);

    if (this.timer && typeof this.timer.unref === "function") {
      this.timer.unref();
    }
  }
}

// Global Singleton for runtime instance
declare global {
  var __mygd_tcp_spooler: TcpPrintSpooler | undefined;
}

export const tcpPrintSpooler: TcpPrintSpooler =
  globalThis.__mygd_tcp_spooler || (globalThis.__mygd_tcp_spooler = new TcpPrintSpooler());
