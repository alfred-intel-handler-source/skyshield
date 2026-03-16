import { useCallback, useEffect, useRef, useState } from "react";
import type { PlacementConfig, ServerMessage } from "../types";

type MessageHandler = (msg: ServerMessage) => void;

export interface ConnectOptions {
  scenarioId: string;
  baseId?: string;
  placement?: PlacementConfig;
}

export function useWebSocket(onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(
    (opts: ConnectOptions | string) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const ws = new WebSocket(`${protocol}//${host}/ws/game`);

      ws.onopen = () => {
        setConnected(true);
        if (typeof opts === "string") {
          // Legacy: just scenario_id
          ws.send(JSON.stringify({ scenario_id: opts }));
        } else {
          const initMsg: Record<string, unknown> = {
            scenario_id: opts.scenarioId,
          };
          if (opts.baseId) {
            initMsg.base_id = opts.baseId;
          }
          if (opts.placement) {
            initMsg.placement = {
              base_id: opts.placement.base_id,
              sensors: opts.placement.sensors,
              effectors: opts.placement.effectors,
            };
          }
          ws.send(JSON.stringify(initMsg));
        }
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data) as ServerMessage;
        onMessage(msg);
      };

      ws.onclose = () => {
        setConnected(false);
      };

      wsRef.current = ws;
    },
    [onMessage],
  );

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { connect, send, disconnect, connected };
}
