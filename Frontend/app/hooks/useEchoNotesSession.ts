"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Summary {
  simple_text: string;
  expanded_text: string;
}

interface UseEchoNotesSessionReturn {
  isConnected: boolean;
  transcriptError: string | null;
  summaryError: string | null;
  summary: Summary | null;
  isProcessing: boolean; // True when transcript is being sent but no summary yet
  sendTranscriptChunk: (text: string) => void;
}

const BACKEND_WS_URL = "ws://localhost:8000";

/**
 * Hook for managing EchoNotes WebSocket connections.
 * 
 * Handles:
 * - Connection to /ws/transcript/{sessionId} for sending transcript chunks
 * - Connection to /ws/summary/{sessionId} for receiving summaries
 * 
 * @param sessionId - Session ID to use for both WebSocket connections
 * @returns Object with connection state, errors, summary data, and send function
 */
export function useEchoNotesSession(
  sessionId: string = "demo"
): UseEchoNotesSessionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasReceivedTranscriptRef = useRef<boolean>(false);

  const transcriptWsRef = useRef<WebSocket | null>(null);
  const summaryWsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const summaryReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const summaryConnectedRef = useRef<boolean>(false);

  const connectTranscript = useCallback(() => {
    if (transcriptWsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const ws = new WebSocket(`${BACKEND_WS_URL}/ws/transcript/${sessionId}`);
      transcriptWsRef.current = ws;

      ws.onopen = () => {
        setTranscriptError(null);
        setIsConnected(true);
      };

      ws.onerror = (error) => {
        // Suppress console spam - errors are handled via state
        setTranscriptError("Failed to connect to transcript service");
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds, but avoid infinite loops
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (transcriptWsRef.current?.readyState !== WebSocket.OPEN) {
            connectTranscript();
          }
        }, 3000);
      };
    } catch (error: any) {
      setTranscriptError(`Failed to create transcript connection: ${error.message}`);
      setIsConnected(false);
    }
  }, [sessionId]);

  const connectSummary = useCallback(() => {
    if (summaryWsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Only connect if transcript WS is ready
    if (!isConnected) {
      return;
    }

    try {
      const ws = new WebSocket(`${BACKEND_WS_URL}/ws/summary/${sessionId}`);
      summaryWsRef.current = ws;

      ws.onopen = () => {
        setSummaryError(null);
        summaryConnectedRef.current = true;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only parse the two fields we need
          if (
            data.simple_text !== undefined &&
            data.expanded_text !== undefined
          ) {
            setSummary({
              simple_text: data.simple_text || "",
              expanded_text: data.expanded_text || "",
            });
            setIsProcessing(false);
          }
        } catch (error) {
          // Suppress console spam
          setSummaryError("Received invalid summary data");
        }
      };

      ws.onerror = (error) => {
        // Suppress console spam
        setSummaryError("Failed to connect to summary service");
        summaryConnectedRef.current = false;
      };

      ws.onclose = () => {
        summaryConnectedRef.current = false;
        // Attempt to reconnect after 3 seconds, but only if transcript is still connected
        if (summaryReconnectTimeoutRef.current) {
          clearTimeout(summaryReconnectTimeoutRef.current);
        }
        summaryReconnectTimeoutRef.current = setTimeout(() => {
          if (isConnected && summaryWsRef.current?.readyState !== WebSocket.OPEN) {
            connectSummary();
          }
        }, 3000);
      };
    } catch (error: any) {
      setSummaryError(`Failed to create summary connection: ${error.message}`);
      summaryConnectedRef.current = false;
    }
  }, [sessionId, isConnected]);

  // Connect transcript WS immediately, then summary WS only after transcript is ready
  useEffect(() => {
    connectTranscript();
  }, [connectTranscript]);

  // Connect summary WS only after transcript WS is fully open
  useEffect(() => {
    if (isConnected && !summaryConnectedRef.current) {
      const wait = setInterval(() => {
        if (isConnected && transcriptWsRef.current?.readyState === WebSocket.OPEN) {
          connectSummary();
          clearInterval(wait);
        }
      }, 300);

      return () => {
        clearInterval(wait);
      };
    }
  }, [isConnected, connectSummary]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (summaryReconnectTimeoutRef.current) {
        clearTimeout(summaryReconnectTimeoutRef.current);
      }
      if (transcriptWsRef.current) {
        transcriptWsRef.current.close();
      }
      if (summaryWsRef.current) {
        summaryWsRef.current.close();
      }
    };
  }, []);

  const sendTranscriptChunk = useCallback(
    (text: string) => {
      if (!text || !text.trim()) {
        return; // Don't send empty chunks
      }

      hasReceivedTranscriptRef.current = true;
      setIsProcessing(true);

      const ws = transcriptWsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(text.trim());
        } catch (error: any) {
          console.error("Failed to send transcript chunk:", error);
          setTranscriptError(`Failed to send transcript: ${error.message}`);
        }
      } else {
        // Try to reconnect if not connected
        if (ws?.readyState === WebSocket.CLOSED) {
          connectTranscript();
        }
        setTranscriptError("Transcript connection not ready");
      }
    },
    [connectTranscript]
  );

  return {
    isConnected,
    transcriptError,
    summaryError,
    summary,
    isProcessing: isProcessing && hasReceivedTranscriptRef.current,
    sendTranscriptChunk,
  };
}

