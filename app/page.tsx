'use client'

import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';

// EXPLANATION: Define types for Note and Video
interface VideoType {
  title: string;
  channel: string;
  views: string;
  topic: string;
  url?: string;  // Optional URL for the video
}

interface Note {
  id: number;
  text: string;
  timestamp: string;
  videos: VideoType[];
}

import { Volume2, Eye, Type, Palette, Mic, BookOpen, Video, Brain, Sparkles, Settings, Check, Play, Headphones, FileText, Youtube, Trash2, Sun, Moon } from 'lucide-react';

export default function EchoNotesLanding() {
  // EXPLANATION: Get theme functions from our custom hook
  const { theme, toggleTheme, isDark } = useTheme();

  // Ensure body gets the correct data-theme attribute for CSS variables
  useEffect(() => {
    try {
      document.body.dataset.theme = theme;
    } catch (e) {
      // ignore when running SSR or in unexpected environments
    }
    try {
      document.title = 'EchoNotes';
    } catch (e) {
      // ignore in restricted environments
    }
  }, [theme]);
  // EXPLANATION: This holds all user customization preferences
  const [customization, setCustomization] = useState({
    overlay: 'none',
    fontSize: 'medium',
    colorblindMode: 'none',
    font: 'default',
    textColor: 'default',
    backgroundColor: 'default',
    lineSpacing: 'normal',
    letterSpacing: 'normal',
    fontWeight: 'normal',
    backgroundPattern: 'none',  // Track which pattern is selected
    overlayOpacity: 0.8 // default overlay opacity (0..1)
  });
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [transcriptProgress, setTranscriptProgress] = useState(0);
  
  // EXPLANATION: State for audio file upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // EXPLANATION: Color palettes for different modes
  const colors: { [key: string]: string } = {
    dark: '#1E2333',
    purple: '#D6AFE9',
    mint: '#EBF5EE',
    sage: '#606D5D'
  };

  // EXPLANATION: Colourblind-safe color palettes
  const colourblindPalettes: { [key: string]: { [key: string]: string } } = {
    none: colors,
    
    // Protanopia (red-blind) - blues and yellows work best
    protanopia: {
      dark: '#1E2333',
      purple: '#4A90E2',
      mint: '#FFF8DC',
      sage: '#8B7355'
    },
    
    // Deuteranopia (green-blind) - blues and oranges work best
    deuteranopia: {
      dark: '#1E2333',
      purple: '#E67E22',
      mint: '#F0F8FF',
      sage: '#5D6D7E'
    },
    
    // Tritanopia (blue-blind) - reds and greens work best
    tritanopia: {
      dark: '#2C1810',
      purple: '#E74C3C',
      mint: '#E8F5E9',
      sage: '#795548'
    }
  };

  // EXPLANATION: Get the active color palette based on colourblind mode
  const activeColors = colourblindPalettes[customization.colorblindMode] || colors;

  // Base overlay RGB values (no alpha) and helper to create rgba with chosen opacity
  const overlayBases: { [key: string]: string } = {
    none: 'transparent',
    yellow: '255, 244, 140',
    blue: '150, 200, 255',
    pink: '255, 170, 200',
    green: '160, 255, 180'
  };

  const getOverlayColor = (name: string, opacity: number) => {
    if (!name || name === 'none') return 'transparent';
    const base = overlayBases[name];
    if (!base) return 'transparent';
    return `rgba(${base}, ${opacity})`;
  };


  const fontSizeMap: { [key: string]: string } = {
    small: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '20px',
    xxlarge: '24px'
  };

  const textColorMap: { [key: string]: string } = {
    default: '#1E2333',
    highContrast: '#000000',
    softBlack: '#2C3E50',
    warmGray: '#4A4A4A',
    coolGray: '#546E7A'
  };

  const backgroundColorMap: { [key: string]: string } = {
    default: '#EBF5EE',
    white: '#FFFFFF',
    cream: '#FFF8E7',
    softBlue: '#E8F4F8',
    lightGray: '#F5F5F5',
    beige: '#F5F1E8'
  };

  const lineSpacingMap: { [key: string]: string } = {
    compact: '1.3',
    normal: '1.5',
    relaxed: '1.8',
    loose: '2.1'
  };

  const letterSpacingMap: { [key: string]: string } = {
    tight: '-0.02em',
    normal: '0',
    relaxed: '0.05em',
    wide: '0.1em'
  };

  const fontWeightMap: { [key: string]: string } = {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  };

  const fontFamilyMap: { [key: string]: string } = {
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    dyslexic: 'Courier, monospace',
    serif: 'Georgia, "Times New Roman", serif',
    rounded: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
  };

  const sampleTranscript = [
    { time: 20, original: "In calculus, a function represents a relationship where...", simple: "📝 A function is like a machine:" },
    { time: 40, original: "each input corresponds to exactly one output.", simple: "you put one number in, and get one number out." },
    { time: 60, original: "We use function notation f(x) to denote...", simple: "We write it as f(x)." },
    { time: 80, original: "the dependent variable's value for input x.", simple: "The 'x' is what you put in, f(x) is what comes out." }
  ];

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setTranscriptProgress((prev) => {
          const newProgress = prev + 5;
          
          // Add notes as they're transcribed
          sampleTranscript.forEach(item => {
            if (newProgress >= item.time && newProgress < item.time + 5) {
              setCurrentNote(prev => prev + ' ' + item.simple);
            }
          });
          
          if (newProgress >= 100) {
            setIsListening(false);
            if (currentNote.trim()) {
              setNotes(prev => [...prev, {
                id: Date.now(),
                text: currentNote.trim(),
                timestamp: new Date().toLocaleTimeString(),
                videos: sampleVideos
              }]);
              setCurrentNote('');
            }
            return 0;
          }
          return newProgress;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isListening, currentNote]);

  const getReadingStyles = () => {
    return {
      // Use CSS variables so theme toggles reliably across the app
      color: 'var(--foreground)',
      backgroundColor: 'var(--background)',
      lineHeight: lineSpacingMap[customization.lineSpacing],
      letterSpacing: letterSpacingMap[customization.letterSpacing],
      fontWeight: fontWeightMap[customization.fontWeight],
      fontSize: fontSizeMap[customization.fontSize],
      fontFamily: fontFamilyMap[customization.font]
    };
  };

  const sampleVideos: VideoType[] = [
    { title: "Functions Explained Simply", channel: "Khan Academy", views: "2.3M", topic: "functions" },
    { title: "Linear Functions Made Easy", channel: "The Organic Chemistry Tutor", views: "890K", topic: "functions" },
    { title: "Understanding Function Notation", channel: "Professor Leonard", views: "456K", topic: "functions" }
  ];

  // Helper: extract YouTube video ID from common URL formats
  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    try {
      // common formats: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
      const ytRegex = /(?:v=|\/v\/|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})(?:[&?#]|$)/;
      const match = url.match(ytRegex);
      if (match && match[1]) return match[1];
      // fallback: try to parse query param v
      const u = new URL(url);
      return u.searchParams.get('v');
    } catch (e) {
      return null;
    }
  };

  const clearAllNotes = () => {
    setNotes([]);
  };

  // Load/save notes to localStorage so "previous notes" persist across reloads
  useEffect(() => {
    try {
      const saved = localStorage.getItem('echonotes_notes');
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('echonotes_notes', JSON.stringify(notes));
    } catch (e) {
      // ignore storage errors
    }
  }, [notes]);

  // EXPLANATION: Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
      if (validTypes.includes(file.type) || file.name.match(/\.(mp3|wav|m4a)$/i)) {
        setUploadedFile(file);
        console.log('File selected:', file.name);
      } else {
        alert('Please select a valid audio file (MP3, WAV, or M4A)');
      }
    }
  };

  // EXPLANATION: Generate notes from audio file
  const generateNotesFromAudio = async () => {
    if (!uploadedFile) {
      alert('Please select an audio file first');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    await new Promise(resolve => setTimeout(resolve, 3000));

    clearInterval(progressInterval);
    setProcessingProgress(100);

    const mockTranscription = {
      original: `Today we'll discuss mitochondria, the powerhouse of the cell. Mitochondria perform cellular respiration through oxidative phosphorylation, converting glucose into ATP via the electron transport chain. This process occurs in the inner mitochondrial membrane where ATP synthase catalyzes the formation of adenosine triphosphate.`,
      simplified: `📝 Today's topic: Mitochondria - the cell's power plants! Mitochondria take food (glucose) and turn it into energy (ATP) that cells can use. This happens through a step-by-step process in a special part of the mitochondria. Think of it like a factory assembly line that produces energy packets.`,
      topics: ['mitochondria', 'cellular respiration', 'ATP', 'cell biology']
    };

    const relevantVideos = mockTranscription.topics.map(topic => ({
      title: `Understanding ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
      channel: 'Khan Academy',
      views: '1.2M',
      topic: topic,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' biology tutorial')}`
    }));

    setNotes(prev => [...prev, {
      id: Date.now(),
      text: mockTranscription.simplified,
      timestamp: new Date().toLocaleTimeString(),
      videos: relevantVideos
    }]);

    setIsProcessing(false);
    setProcessingProgress(0);
    setUploadedFile(null);
    
    const fileInput = document.getElementById('audio-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div 
      className={`min-h-screen ${customization.backgroundPattern !== 'none' ? `pattern-${customization.backgroundPattern}` : ''}`}
      data-theme={theme}
      style={{
        backgroundColor: 'var(--background)',
        position: 'relative',
        color: 'var(--foreground)',
        // If a colourblind palette is selected, apply its values as CSS variables
        ...(() => {
          const cssVars: any = {};
          if (customization.colorblindMode && customization.colorblindMode !== 'none') {
            // Respect the current theme: swap background/foreground for light mode
            if (isDark) {
              cssVars['--background'] = activeColors.dark;
              cssVars['--foreground'] = activeColors.mint;
            } else {
              cssVars['--background'] = activeColors.mint;
              cssVars['--foreground'] = activeColors.dark;
            }
            cssVars['--accent'] = activeColors.purple;
            cssVars['--muted'] = activeColors.sage;
          }
          return cssVars;
        })()
      }}
    >
      {/* Content Layer */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* EXPLANATION: Theme Toggle Button - Switches between light and dark mode */}
        <button
          onClick={toggleTheme}
          className="fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg hover:scale-110 transition-transform border-2"
          style={{ 
            backgroundColor: 'var(--accent)',
            color: 'var(--foreground)',
            borderColor: isDark ? 'var(--background)' : 'var(--foreground)'
          }}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        {/* Accessibility Customizer Panel */}
        <button
          onClick={() => setShowCustomizer(!showCustomizer)}
          className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg hover:scale-110 transition-transform border-2"
          style={{ 
            backgroundColor: 'var(--accent)',
            color: 'var(--foreground)',
            borderColor: showCustomizer ? 'var(--foreground)' : 'transparent'
          }}
          aria-label="Open accessibility settings"
        >
          <Settings className="w-6 h-6" />
        </button>

        {showCustomizer && (
          <div className="fixed top-20 right-4 z-50 p-6 rounded-xl shadow-2xl w-96 border-2 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--accent)', color: 'var(--foreground)' }}>
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Eye className="w-5 h-5" />
              Reading Customization
            </h3>

            <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
              Tweak the reading and display settings to make notes easier to read — font, spacing,
              overlays and background patterns are all available here.
            </p>

            <div className="space-y-5">
              {/* Font Style */}
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--muted)' }}>
                  <Type className="w-4 h-4 inline mr-2" />
                  Font Style
                </label>
                <select
                  value={customization.font}
                  onChange={(e) => setCustomization({...customization, font: e.target.value})}
                  className="w-full p-2 rounded border-2"
                  style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }}
                >
                  <option value="default">Sans-Serif (Default)</option>
                  <option value="dyslexic">Monospace (Dyslexia Friendly)</option>
                  <option value="serif">Serif (Traditional)</option>
                  <option value="rounded">Rounded (Friendly)</option>
                </select>
              </div>

              {/* Text Color */}
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--muted)' }}>
                  <Palette className="w-4 h-4 inline mr-2" />
                  Text Color
                </label>
                <select
                  value={customization.textColor}
                  onChange={(e) => setCustomization({...customization, textColor: e.target.value})}
                  className="w-full p-2 rounded border-2"
                  style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }}
                >
                  <option value="default">Default Dark</option>
                  <option value="highContrast">High Contrast Black</option>
                  <option value="softBlack">Soft Black</option>
                  <option value="warmGray">Warm Gray</option>
                  <option value="coolGray">Cool Gray</option>
                </select>
              </div>

              {/* Background Color */}
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--muted)' }}>
                  <Palette className="w-4 h-4 inline mr-2" />
                  Background Color
                </label>
                <select
                  value={customization.backgroundColor}
                  onChange={(e) => setCustomization({...customization, backgroundColor: e.target.value})}
                  className="w-full p-2 rounded border-2"
                  style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }}
                >
                  <option value="default">Default Mint</option>
                  <option value="white">Pure White</option>
                  <option value="cream">Cream</option>
                  <option value="softBlue">Soft Blue</option>
                  <option value="lightGray">Light Gray</option>
                  <option value="beige">Beige</option>
                </select>
              </div>

              {/* Line Spacing */}
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--muted)' }}>
                  <Type className="w-4 h-4 inline mr-2" />
                  Line Spacing
                </label>
                <select
                  value={customization.lineSpacing}
                  onChange={(e) => setCustomization({...customization, lineSpacing: e.target.value})}
                  className="w-full p-2 rounded border-2"
                  style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }}
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relaxed</option>
                  <option value="loose">Loose</option>
                </select>
              </div>

              {/* Letter Spacing */}
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--muted)' }}>
                  <Type className="w-4 h-4 inline mr-2" />
                  Letter Spacing
                </label>
                <select
                  value={customization.letterSpacing}
                  onChange={(e) => setCustomization({...customization, letterSpacing: e.target.value})}
                  className="w-full p-2 rounded border-2"
                  style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }}
                >
                  <option value="tight">Tight</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relaxed</option>
                  <option value="wide">Wide</option>
                </select>
              </div>

              {/* Color Overlay */}
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--muted)' }}>
                  <Palette className="w-4 h-4 inline mr-2" />
                  Color Overlay
                </label>
                <select
                  value={customization.overlay}
                  onChange={(e) => setCustomization({...customization, overlay: e.target.value})}
                  className="w-full p-2 rounded border-2"
                  style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }}
                >
                  <option value="none">None</option>
                  <option value="yellow">Yellow (Reduce Glare)</option>
                  <option value="blue">Blue (Calm)</option>
                  <option value="pink">Pink (Warm)</option>
                  <option value="green">Green (Natural)</option>
                </select>
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Choose an overlay color; adjust intensity below.</p>
              </div>

              {/* Background Pattern */}
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--muted)' }}>
                  <Palette className="w-4 h-4 inline mr-2" />
                  Background Pattern
                </label>
                <select
                  value={customization.backgroundPattern}
                  onChange={(e) => setCustomization({...customization, backgroundPattern: e.target.value})}
                  className="w-full p-2 rounded border-2"
                  style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }}
                >
                  <option value="none">None (Plain)</option>
                  <option value="dots">Subtle Dots</option>
                  <option value="stripes">Subtle Stripes</option>
                  <option value="grid">Subtle Grid</option>
                  <option value="waves">Gentle Waves</option>
                  <option value="crosshatch">Crosshatch</option>
                </select>
              </div>

              {/* Colourblind Mode */}
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--muted)' }}>
                  <Eye className="w-4 h-4 inline mr-2" />
                  Colourblind-Friendly Mode
                </label>
                <select
                  value={customization.colorblindMode}
                  onChange={(e) => setCustomization({...customization, colorblindMode: e.target.value})}
                  className="w-full p-2 rounded border-2"
                  style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--background)' }}
                >
                  <option value="none">Standard Colors</option>
                  <option value="protanopia">Protanopia (Red-Blind)</option>
                  <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                  <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                </select>
                {customization.colorblindMode !== 'none' && (
                  <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                    ✓ Using accessible color palette optimized for {customization.colorblindMode}
                  </p>
                )}
              </div>

              {/* Overlay intensity (moved lower for clarity) */}
              <div className="pt-3">
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--muted)' }}>Overlay Opacity</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={customization.overlayOpacity}
                  onChange={(e) => setCustomization({...customization, overlayOpacity: parseFloat(e.target.value)})}
                  className="w-full mb-1"
                />
                <div className="text-xs mb-2" style={{ color: 'var(--muted)' }}>{Math.round(customization.overlayOpacity * 100)}%</div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => setCustomization({
                  overlay: 'none',
                  fontSize: 'medium',
                  colorblindMode: 'none',
                  font: 'default',
                  textColor: 'default',
                  backgroundColor: 'default',
                  lineSpacing: 'normal',
                  letterSpacing: 'normal',
                  fontWeight: 'normal',
                  backgroundPattern: 'none',
                  overlayOpacity: 0.8
                })}
                className="w-full p-3 rounded-lg font-semibold hover:scale-105 transition-transform"
                style={{ backgroundColor: 'var(--muted)', color: 'var(--background)' }}
              >
                Reset to Default
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <svg width="180" height="70" viewBox="0 0 180 70" className="drop-shadow-xl">
                <circle cx="35" cy="35" r="10" style={{ fill: 'var(--accent)' }} opacity="0.3" className="animate-ping" />
                <circle cx="35" cy="35" r="15" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="2" opacity="0.6" />
                <circle cx="35" cy="35" r="20" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="2" opacity="0.4" />
                <circle cx="35" cy="35" r="25" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="2" opacity="0.2" />
                <circle cx="35" cy="35" r="8" style={{ fill: 'var(--foreground)' }} />
                <rect x="32" y="30" width="6" height="12" style={{ fill: 'var(--background)' }} rx="3" />
                <rect x="55" y="20" width="30" height="30" style={{ fill: 'var(--background)', stroke: 'var(--foreground)' }} strokeWidth="2" rx="2" />
                <line x1="60" y1="27" x2="80" y2="27" style={{ stroke: 'var(--muted)' }} strokeWidth="2" />
                <line x1="60" y1="33" x2="80" y2="33" style={{ stroke: 'var(--muted)' }} strokeWidth="2" />
                <line x1="60" y1="39" x2="75" y2="39" style={{ stroke: 'var(--muted)' }} strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Brand Name & Tagline */}
          <div className="text-center mb-16">
            <h1 className="text-7xl font-bold mb-3 tracking-tight" style={{ color: 'var(--foreground)' }}>
              Echo<span style={{ color: 'var(--accent)' }}>Notes</span>
            </h1>
            <p className="text-2xl font-medium" style={{ color: 'var(--muted)' }}>
              Making learning clearer for everyone
            </p>
          </div>

          {/* Main Live Listening Demo */}
          <div className="max-w-5xl mx-auto mb-16 rounded-2xl shadow-2xl overflow-hidden border-4" style={{ borderColor: 'var(--accent)' }}>
            <div className="p-8" style={{ backgroundColor: 'var(--foreground)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--background)' }}>
                  <Mic className={`w-8 h-8 ${isListening ? 'animate-pulse' : ''}`} style={{ color: activeColors.purple }} />
                  Live Lecture Listening
                </h2>

                <button
                  onClick={() => setIsListening(!isListening)}
                  className="px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                  style={{ backgroundColor: isListening ? activeColors.sage : activeColors.purple, color: activeColors.dark }}
                >
                  {isListening ? (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      Listening...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Demo
                    </>
                  )}
                </button>
              </div>

              {isListening && (
                <div className="flex items-center justify-center gap-1 mb-6 h-16">
                  {[...Array(40)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full transition-all"
                      style={{
                        backgroundColor: activeColors.purple,
                        height: `${Math.random() * 100}%`,
                        animation: 'pulse 0.5s ease-in-out infinite',
                        animationDelay: `${i * 0.05}s`
                      }}
                    />
                  ))}
                </div>
              )}

              {isListening && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--muted)', position: 'relative' }}>
                    {customization.overlay !== 'none' && (
                      <div
                        aria-hidden
                        style={{
                          pointerEvents: 'none',
                          position: 'absolute',
                          zIndex: 3,
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: getOverlayColor(customization.overlay, customization.overlayOpacity),
                          borderRadius: 'inherit',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Headphones className="w-5 h-5" style={{ color: 'var(--background)' }} />
                        <h3 className="font-bold" style={{ color: 'var(--background)' }}>What You're Hearing</h3>
                      </div>
                      <p style={{ color: activeColors.mint, lineHeight: '1.5' }}>
                        {sampleTranscript.filter(t => transcriptProgress >= t.time).map(t => t.original).join(' ')}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl" style={{ ...getReadingStyles(), position: 'relative' }}>
                    {customization.overlay !== 'none' && (
                      <div
                        aria-hidden
                        style={{
                          pointerEvents: 'none',
                          position: 'absolute',
                          zIndex: 3,
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: getOverlayColor(customization.overlay, customization.overlayOpacity),
                          borderRadius: 'inherit',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                        <h3 className="font-bold" style={{ color: 'var(--foreground)' }}>Your Clear Notes</h3>
                      </div>
                      <p style={getReadingStyles()}>
                        {currentNote}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isListening && (
                <div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: activeColors.sage }}>
                    <div
                      className="h-full transition-all duration-200"
                      style={{ backgroundColor: activeColors.purple, width: `${transcriptProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audio File Upload Section */}
          <div className="max-w-5xl mx-auto mb-16 rounded-2xl shadow-2xl overflow-hidden border-4" style={{ borderColor: 'var(--accent)' }}>
            <div className="p-8" style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--background)' }}>
                <FileText className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                Upload Lecture Recording
              </h2>
              
              <p className="mb-6" style={{ color: 'var(--background)', opacity: 0.9 }}>
                Upload an audio file from your lecture or recording, and we'll generate clear, simplified notes for you.
              </p>

              {/* File Upload Area */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    id="audio-file-input"
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <label
                    htmlFor="audio-file-input"
                    className="px-6 py-3 rounded-lg font-bold cursor-pointer hover:scale-105 transition-transform flex items-center gap-2"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--foreground)' }}
                  >
                    <FileText className="w-5 h-5" />
                    Choose Audio File
                  </label>

                  {uploadedFile && (
                    <span style={{ color: 'var(--background)' }} className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      {uploadedFile.name}
                    </span>
                  )}
                </div>

                <button
                  onClick={generateNotesFromAudio}
                  disabled={!uploadedFile || isProcessing}
                  className="px-8 py-4 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: uploadedFile && !isProcessing ? 'var(--accent)' : 'var(--muted)', 
                    color: 'var(--foreground)' 
                  }}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--foreground)' }}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Notes
                    </>
                  )}
                </button>

                {isProcessing && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm" style={{ color: 'var(--background)' }}>
                      <span>Transcribing and simplifying your lecture...</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                      <div
                        className="h-full transition-all duration-300"
                        style={{ 
                          backgroundColor: 'var(--accent)', 
                          width: `${processingProgress}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-sm" style={{ color: 'var(--background)', opacity: 0.7 }}>
                  Supported formats: MP3, WAV, M4A
                </p>
              </div>
            </div>
          </div>

          {/* Saved Notes Section */}
          {notes.length > 0 && (
            <div className="max-w-5xl mx-auto mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3" style={{ color: activeColors.dark }}>
                  <BookOpen className="w-8 h-8" style={{ color: activeColors.purple }} />
                  Your Saved Notes ({notes.length})
                </h2>
                <button
                  onClick={clearAllNotes}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
                  style={{ backgroundColor: activeColors.sage, color: activeColors.mint }}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>

              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl shadow-lg overflow-hidden border-2" style={{ borderColor: activeColors.purple }}>
                    <div className="p-6" style={{ ...getReadingStyles(), position: 'relative' }}>
                      {customization.overlay !== 'none' && (
                        <div
                          aria-hidden
                          style={{
                            pointerEvents: 'none',
                            position: 'absolute',
                            zIndex: 3,
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: getOverlayColor(customization.overlay, customization.overlayOpacity),
                            borderRadius: 'inherit',
                          }}
                        />
                      )}
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5" style={{ color: textColorMap[customization.textColor] }} />
                          <span className="text-sm font-semibold" style={{ color: textColorMap[customization.textColor] }}>
                            {note.timestamp}
                          </span>
                        </div>
                        <button
                          onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                          className="p-2 rounded-lg hover:scale-110 transition-transform"
                          style={{ backgroundColor: activeColors.purple }}
                        >
                          <Trash2 className="w-4 h-4" style={{ color: activeColors.dark }} />
                        </button>
                      </div>
                      <p style={getReadingStyles()}>
                        {note.text}
                      </p>
                    </div>
                    </div>

                    <div className="p-6" style={{ backgroundColor: activeColors.mint }}>
                      <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: activeColors.dark }}>
                        <Youtube className="w-5 h-5" style={{ color: activeColors.purple }} />
                        Related Study Videos
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {note.videos.map((video: VideoType, idx: number) => {
                          const ytId = getYouTubeId(video.url);
                          const thumbnail = ytId
                            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                            : `https://via.placeholder.com/480x270?text=${encodeURIComponent(video.channel || 'No+Thumbnail')}`;
                          const href = video.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(video.topic + ' tutorial')}`;
                          return (
                            <a
                              key={idx}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-4 rounded-lg border-2 hover:scale-105 transition-transform cursor-pointer"
                              style={{ backgroundColor: 'var(--background)', borderColor: 'var(--accent)' }}
                            >
                              <div className="w-full h-32 rounded mb-3 overflow-hidden bg-black flex items-center justify-center">
                                <img src={thumbnail} alt={video.title} className="w-full h-full object-cover" />
                              </div>
                              <h5 className="font-bold mb-2 text-sm" style={{ color: 'var(--foreground)' }}>{video.title}</h5>
                              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{video.channel}</p>
                              <p className="text-xs" style={{ color: 'var(--muted)' }}>{video.views} views</p>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: activeColors.dark }}>
              How EchoNotes Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: activeColors.purple }}>
                  <Mic className="w-10 h-10" style={{ color: activeColors.dark }} />
                </div>
                <h3 className="font-bold text-xl mb-2" style={{ color: activeColors.dark }}>1. Listen</h3>
                <p style={{ color: activeColors.sage }}>
                  EchoNotes captures your lecture audio in real-time or from recordings
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: activeColors.purple }}>
                  <Brain className="w-10 h-10" style={{ color: activeColors.dark }} />
                </div>
                <h3 className="font-bold text-xl mb-2" style={{ color: activeColors.dark }}>2. Simplify</h3>
                <p style={{ color: activeColors.sage }}>
                  Complex jargon is automatically translated into clear, plain language
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: activeColors.purple }}>
                  <Video className="w-10 h-10" style={{ color: activeColors.dark }} />
                </div>
                <h3 className="font-bold text-xl mb-2" style={{ color: activeColors.dark }}>3. Connect</h3>
                <p style={{ color: activeColors.sage }}>
                  Relevant YouTube study videos are linked to specific topics mentioned
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mb-12">
            <p className="mt-6 text-lg" style={{ color: activeColors.sage }}>
              Making learning clearer for everyone
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}