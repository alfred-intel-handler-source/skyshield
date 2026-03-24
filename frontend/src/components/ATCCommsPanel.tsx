import React, { useEffect, useRef, useState } from "react";

export interface ATCCommsMessage {
  id: string;
  label: string;
  outbound: string;
  inbound?: string;
  timestamp: number;
}

export interface ATCCommsPanelProps {
  messages: ATCCommsMessage[];
  onDismiss: () => void;
  visible: boolean;
}

function TypewriterText({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(0);
  const intervalRef = useRef<number>(0);

  useEffect(() => {
    setRevealed(0);
    const charDelay = Math.max(10, 1500 / text.length);
    intervalRef.current = window.setInterval(() => {
      setRevealed((prev) => {
        if (prev >= text.length) {
          window.clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, charDelay);
    return () => window.clearInterval(intervalRef.current);
  }, [text]);

  return <span>{text.slice(0, revealed)}{revealed < text.length ? "\u2588" : ""}</span>;
}

export default function ATCCommsPanel({ messages, onDismiss, visible }: ATCCommsPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!visible || messages.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: 16,
        width: 320,
        maxHeight: 260,
        zIndex: 200,
        background: "#0d1117cc",
        border: "1px solid #22d3ee",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        fontFamily: "monospace",
        fontSize: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 10px",
          borderBottom: "1px solid #22d3ee44",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#22d3ee", fontSize: 11, fontWeight: 600 }}>
          📡 RADIO — ATC
        </span>
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            color: "#8b949e",
            cursor: "pointer",
            fontSize: 14,
            padding: "0 2px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{ overflowY: "auto", padding: "6px 10px", flex: 1 }}>
        {messages.map((msg) => (
          <div key={msg.id + msg.timestamp} style={{ marginBottom: 8 }}>
            {/* Outbound */}
            <div style={{ color: "#8b949e", marginBottom: 2 }}>
              <span style={{ fontWeight: 700 }}>OPS ▶</span> {msg.outbound}
            </div>
            {/* Inbound */}
            {msg.inbound ? (
              <div style={{ color: "#22d3ee" }}>
                <span style={{ fontWeight: 700 }}>ATC ◀</span>{" "}
                <TypewriterText text={msg.inbound} />
              </div>
            ) : (
              <div style={{ color: "#8b949e88" }}>
                <span style={{ fontWeight: 700 }}>ATC ◀</span> ...
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
