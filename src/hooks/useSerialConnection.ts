/// <reference types="w3c-web-serial" />
import { useState, useCallback, useRef, useEffect } from "react";

import { parseMeasurement } from "@/lib/serialMeasurement";
import type { MeasurementData } from "@/lib/serialMeasurement";
export type { MeasurementData } from "@/lib/serialMeasurement";
import { useLanguage } from "@/i18n/LanguageContext";

export interface SerialConnectionState {
  isConnected: boolean;
  isSupported: boolean;
  portName: string | null;
  measurements: MeasurementData[];
  lastError: string | null;
}

export function useSerialConnection() {
  const { language } = useLanguage();
  const msg = (fr: string, en: string) => language === "fr" ? fr : en;
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
  const readTaskRef = useRef<Promise<void> | null>(null);

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
          isConnected: false,
          lastError: msg("Lecture USB interrompue. Déconnectez puis reconnectez la Nano.", "USB reading interrupted. Disconnect and reconnect the Nano."),
        }));
      }
    } finally {
      isReadingRef.current = false;
      readerRef.current?.releaseLock();
      readerRef.current = null;
    }
  }, [language]);

  const connect = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        lastError: msg("Utilisez Chrome ou Edge sur ordinateur pour la connexion USB.", "Use desktop Chrome or Edge for USB connection."),
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

      // Nano resets when USB opens; wait for its bootloader before SCAN.
      await new Promise(resolve => setTimeout(resolve, 2000));
      readTaskRef.current = readLoop();
      return true;
    } catch (error) {
      console.error("Serial connection error:", error);
      setState((prev) => ({
        ...prev,
        lastError:
          error instanceof Error
            ? error.message
            : msg("Impossible de connecter la Nano.", "Unable to connect the Nano."),
      }));
      return false;
    }
  }, [state.isSupported, readLoop, language]);

  const disconnect = useCallback(async () => {
    isReadingRef.current = false;

    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        await readTaskRef.current;
        readTaskRef.current = null;
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

  // Release the USB port if the panel unmounts, so Arduino IDE or a later
  // reconnection is not blocked by a port left open in this tab.
  useEffect(() => () => {
    isReadingRef.current = false;
    const reader = readerRef.current;
    const port = portRef.current;
    const task = readTaskRef.current;
    portRef.current = null;
    void (async () => {
      try {
        if (reader) { await reader.cancel(); await task; }
        if (port) await port.close();
      } catch (error) {
        console.warn("Serial cleanup error:", error);
      }
    })();
  }, []);

  const sendCommand = useCallback(async (command: string) => {
    if (!portRef.current?.writable) {
      setState((prev) => ({
        ...prev,
        lastError: msg("Port USB indisponible.", "USB port unavailable."),
      }));
      return false;
    }

    let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
    try {
      writer = portRef.current.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(command + "\n"));
      return true;
    } catch (error) {
      console.error("Send command error:", error);
      setState((prev) => ({
        ...prev,
        lastError: msg("Impossible d’envoyer la commande à la Nano.", "Unable to send the command to the Nano."),
      }));
      return false;
    } finally {
      writer?.releaseLock();
    }
  }, [language]);

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
