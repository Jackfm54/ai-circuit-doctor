/// <reference types="w3c-web-serial" />
import { useState, useCallback, useRef } from "react";

export interface MeasurementData {
  type: "voltage" | "continuity" | "resistance" | "signal";
  channel: number;
  value: number;
  unit: string;
  timestamp: number;
  status: "ok" | "warning" | "error";
}

export interface SerialConnectionState {
  isConnected: boolean;
  isSupported: boolean;
  portName: string | null;
  measurements: MeasurementData[];
  lastError: string | null;
}

export function useSerialConnection() {
  const [state, setState] = useState<SerialConnectionState>({
    isConnected: false,
    isSupported: typeof navigator !== "undefined" && "serial" in navigator,
    portName: null,
    measurements: [],
    lastError: null,
  });

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const isReadingRef = useRef(false);

  const parseMeasurement = useCallback((line: string): MeasurementData | null => {
    try {
      // Expected format from Arduino: TYPE,CHANNEL,VALUE,UNIT,STATUS
      // Example: VOLTAGE,1,3.32,V,ok
      // Example: CONTINUITY,2,1,CONN,ok
      // Example: RESISTANCE,3,4700,OHM,ok
      const parts = line.trim().split(",");
      if (parts.length < 5) return null;

      const typeMap: Record<string, MeasurementData["type"]> = {
        VOLTAGE: "voltage",
        CONTINUITY: "continuity",
        RESISTANCE: "resistance",
        SIGNAL: "signal",
      };

      const type = typeMap[parts[0].toUpperCase()];
      if (!type) return null;

      return {
        type,
        channel: parseInt(parts[1], 10),
        value: parseFloat(parts[2]),
        unit: parts[3],
        timestamp: Date.now(),
        status: parts[4].toLowerCase() as "ok" | "warning" | "error",
      };
    } catch {
      return null;
    }
  }, []);

  const readLoop = useCallback(async () => {
    if (!portRef.current?.readable) return;

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      readerRef.current = portRef.current.readable.getReader();
      isReadingRef.current = true;

      while (isReadingRef.current && portRef.current?.readable) {
        const { value, done } = await readerRef.current.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const measurement = parseMeasurement(line);
          if (measurement) {
            setState((prev) => ({
              ...prev,
              measurements: [...prev.measurements.slice(-99), measurement],
            }));
          }
        }
      }
    } catch (error) {
      if (isReadingRef.current) {
        console.error("Serial read error:", error);
        setState((prev) => ({
          ...prev,
          lastError: "Error leyendo datos del puerto serial",
        }));
      }
    } finally {
      readerRef.current?.releaseLock();
      readerRef.current = null;
    }
  }, [parseMeasurement]);

  const connect = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        lastError: "Web Serial API no está soportado en este navegador",
      }));
      return false;
    }

    try {
      const port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x2341 }, // Arduino
          { usbVendorId: 0x10c4 }, // ESP32 (Silicon Labs)
          { usbVendorId: 0x1a86 }, // CH340
          { usbVendorId: 0x0403 }, // FTDI
        ],
      });

      await port.open({ baudRate: 115200 });
      portRef.current = port;

      const info = port.getInfo();
      const portName = `USB Device (${info.usbVendorId?.toString(16) || "unknown"})`;

      setState((prev) => ({
        ...prev,
        isConnected: true,
        portName,
        lastError: null,
        measurements: [],
      }));

      readLoop();
      return true;
    } catch (error) {
      console.error("Serial connection error:", error);
      setState((prev) => ({
        ...prev,
        lastError:
          error instanceof Error
            ? error.message
            : "No se pudo conectar al dispositivo",
      }));
      return false;
    }
  }, [state.isSupported, readLoop]);

  const disconnect = useCallback(async () => {
    isReadingRef.current = false;

    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }

      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isConnected: false,
        portName: null,
      }));
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  }, []);

  const sendCommand = useCallback(async (command: string) => {
    if (!portRef.current?.writable) {
      setState((prev) => ({
        ...prev,
        lastError: "Puerto no disponible para escritura",
      }));
      return false;
    }

    try {
      const writer = portRef.current.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(command + "\n"));
      writer.releaseLock();
      return true;
    } catch (error) {
      console.error("Send command error:", error);
      setState((prev) => ({
        ...prev,
        lastError: "Error enviando comando al dispositivo",
      }));
      return false;
    }
  }, []);

  const clearMeasurements = useCallback(() => {
    setState((prev) => ({ ...prev, measurements: [] }));
  }, []);

  const startScan = useCallback(() => sendCommand("SCAN"), [sendCommand]);
  const stopScan = useCallback(() => sendCommand("STOP"), [sendCommand]);

  return {
    ...state,
    connect,
    disconnect,
    sendCommand,
    clearMeasurements,
    startScan,
    stopScan,
  };
}
