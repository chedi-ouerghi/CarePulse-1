"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

interface UseSocketOptions {
  patientId?: string | null;
  token?: string | null;
  enabled?: boolean;
}

export function useSocket(options: UseSocketOptions) {
  const { patientId = null, token = null, enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{
    event: string;
    payload: any;
  } | null>(null);

  useEffect(() => {
    if (!token || !enabled) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("alert", (payload) => {
      setLastEvent({ event: "alert", payload });
    });

    socket.on("risk_alert", (payload) => {
      setLastEvent({ event: "risk_alert", payload });
    });

    socket.on("clinical_report", (payload) => {
      setLastEvent({ event: "clinical_report", payload });
    });

    // If patientId is provided, subscribe to that patient's room
    if (patientId) {
      socket.emit("subscribe:patient", { patientId });
    }

    return () => {
      if (patientId) {
        socket.emit("unsubscribe:patient", { patientId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [patientId, token, enabled]);

  const subscribe = useCallback(
    (event: string, handler: (payload: any) => void) => {
      socketRef.current?.on(event, handler);
      return () => socketRef.current?.off(event, handler);
    },
    []
  );

  const emit = useCallback(
    (event: string, data?: any) => {
      socketRef.current?.emit(event, data);
    },
    []
  );

  return { isConnected, lastEvent, subscribe, emit };
}
