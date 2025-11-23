"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseLectureTranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseLectureTranscriptionReturn {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
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

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const lastFinalTextRef = useRef<string>("");

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
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        let errorMsg = "Speech recognition error";
        
        if (event.error === "no-speech") {
          errorMsg = "No speech detected. Please try again.";
        } else if (event.error === "audio-capture") {
          errorMsg = "Microphone not found. Please check your microphone settings.";
        } else if (event.error === "not-allowed") {
          errorMsg = "Microphone permission denied. Please allow microphone access.";
        } else if (event.error === "network") {
          errorMsg = "Network error. Please check your connection.";
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
          setTranscript(newText);
          lastFinalTextRef.current = newText;
          
          // Call callback with the new chunk (only final results to avoid duplicates)
          onTextChunk(finalTranscript.trim());
        } else if (interimTranscript && interimResults) {
          setTranscript(lastFinalTextRef.current + interimTranscript);
        }
      };
    } else {
      setIsSupported(false);
      setError("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [language, continuous, interimResults, onTextChunk]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Web Speech API is not supported in this browser.");
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        lastFinalTextRef.current = transcript; // Preserve existing transcript
        recognitionRef.current.start();
      } catch (e: any) {
        if (e.name === "InvalidStateError") {
          // Already started, ignore
        } else {
          setError(`Failed to start listening: ${e.message}`);
        }
      }
    }
  }, [isSupported, isListening, transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    transcript,
  };
}

