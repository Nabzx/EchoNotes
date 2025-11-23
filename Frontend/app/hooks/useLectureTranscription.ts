"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseLectureTranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseLectureTranscriptionReturn {
  isRecording: boolean;
  isSupported: boolean;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  transcriptText: string;
  // Legacy aliases for backward compatibility
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
}

/**
 * Hook for using the Web Speech API (webkitSpeechRecognition) to transcribe live speech.
 * 
 * @param onTextChunk - Callback called with each new transcript chunk (phrase/sentence)
 * @param options - Configuration options for the speech recognition
 * @returns Object with listening state, controls, and transcript
 */
export function useLectureTranscription(
  onTextChunk: (text: string) => void,
  options: UseLectureTranscriptionOptions = {}
): UseLectureTranscriptionReturn {
  const {
    language = "en-US",
    continuous = true,
    interimResults = false, // Only use final results to avoid duplicates
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const lastFinalTextRef = useRef<string>("");
  const shouldRestartRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
        shouldRestartRef.current = true;
      };

      recognition.onend = () => {
        setIsRecording(false);
        
        // Auto-restart if we should be recording and user hasn't explicitly stopped
        if (shouldRestartRef.current && recognitionRef.current) {
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            try {
              if (shouldRestartRef.current && recognitionRef.current) {
                recognitionRef.current.start();
              }
            } catch (e: any) {
              if (e.name !== "InvalidStateError") {
                setError(`Failed to restart recognition: ${e.message}`);
              }
            }
          }, 500);
        }
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        let errorMsg = "Speech recognition error";
        
        if (event.error === "no-speech") {
          // Don't show error for no-speech, just silently continue
          if (shouldRestartRef.current) {
            // Will auto-restart via onend
            return;
          }
          errorMsg = "No speech detected. Please try again.";
        } else if (event.error === "audio-capture") {
          errorMsg = "Microphone not found. Please check your microphone settings.";
          shouldRestartRef.current = false;
        } else if (event.error === "not-allowed") {
          errorMsg = "Microphone permission denied. Please allow microphone access.";
          shouldRestartRef.current = false;
        } else if (event.error === "network") {
          errorMsg = "Network error. Please check your connection.";
          // Will attempt to restart if shouldRestartRef is true
        } else {
          errorMsg = `Speech recognition error: ${event.error}`;
        }
        
        setError(errorMsg);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        // Update full transcript for display
        if (finalTranscript) {
          const newText = lastFinalTextRef.current + finalTranscript;
          setTranscriptText(newText);
          lastFinalTextRef.current = newText;
          
          // Call callback with the new chunk (only final results to avoid duplicates)
          onTextChunk(finalTranscript.trim());
        } else if (interimTranscript && interimResults) {
          setTranscriptText(lastFinalTextRef.current + interimTranscript);
        }
      };
    } else {
      setIsSupported(false);
      setError("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
    }

    return () => {
      shouldRestartRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [language, continuous, interimResults, onTextChunk]);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      setError("Web Speech API is not supported in this browser.");
      return;
    }

    setIsRecording(true);

    if (recognitionRef.current && !isRecording) {
      try {
        shouldRestartRef.current = true;
        lastFinalTextRef.current = transcriptText; // Preserve existing transcript
        recognitionRef.current.start();
      } catch (e: any) {
        if (e.name === "InvalidStateError") {
          // Already started, ignore
        } else {
          setError(`Failed to start recording: ${e.message}`);
        }
      }
    }
  }, [isSupported, isRecording, transcriptText]);

  const stopRecording = useCallback(() => {
    shouldRestartRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    if (recognitionRef.current && isRecording) {
      console.log("is recording true");
      
      try {
        recognitionRef.current.stop();
        console.log("in this function");
        // Flush any remaining partial text
        if (onTextChunk && transcriptText && transcriptText !== lastFinalTextRef.current) {
          
          const remaining = transcriptText.slice(lastFinalTextRef.current.length).trim();
          if (remaining) {
            onTextChunk(remaining);
          }
        }
        setIsRecording(false)
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
        console.error("Error stopping recognition:", e);
      }
    }
  }, [isRecording, transcriptText, onTextChunk]);

  // Legacy aliases for backward compatibility
  const startListening = startRecording;
  const stopListening = stopRecording;
  const isListening = isRecording;
  const transcript = transcriptText;

  return {
    isRecording,
    isSupported,
    error,
    startRecording,
    stopRecording,
    transcriptText,
    // Legacy aliases
    isListening,
    startListening,
    stopListening,
    transcript,
  };
}


