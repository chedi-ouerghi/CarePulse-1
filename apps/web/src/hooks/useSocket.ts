"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

export function useSocket(patientId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{
    event: string;
    payload: any;
  } | null>(null);

  useEffect(() => {
    if (!patientId) return;

    const socket = io(WS_URL, {
      query: { patientId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("pattern_detected", (payload) => {
      setLastEvent({ event: "pattern_detected", payload });
    });

    socket.on("coach_message", (payload) => {
      setLastEvent({ event: "coach_message", payload });
    });

    socket.on("brief_generated", (payload) => {
      setLastEvent({ event: "brief_generated", payload });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [patientId]);

  const subscribe = useCallback(
    (event: string, handler: (payload: any) => void) => {
      socketRef.current?.on(event, handler);
      return () => socketRef.current?.off(event, handler);
    },
    []
  );

  return { isConnected, lastEvent, subscribe };
}
