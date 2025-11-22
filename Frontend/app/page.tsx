"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import { Volume2, Eye, Type, Palette, Mic, BookOpen, Video, Brain, Sparkles, Settings, Check, Play, Headphones, FileText, Youtube, Trash2, Sun, Moon } from "lucide-react";
export default function EchoNotesLanding() {
  // SVG filters for colorblind simulation (must be present in DOM for filter:url usage)
  const colorblindSVGFilters = (
    <svg className="colorblind-svg-filters">
      <filter id="protanopia-filter">
        <feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0" />
      </filter>
      <filter id="deuteranopia-filter">
        <feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0" />
      </filter>
      <filter id="tritanopia-filter">
        <feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0" />
      </filter>
    </svg>
  );

  // EXPLANATION: Get theme functions from our custom hook
  const { theme, toggleTheme, isDark } = useTheme();

  // EXPLANATION: This holds all user customization preferences
  // We added 'backgroundPattern' to store which pattern the user chose
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
    backgroundPattern: 'none'  // 🆕 NEW: Track which pattern is selected
  });
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcriptProgress, setTranscriptProgress] = useState(0);

  // Ensure body gets the correct data-theme attribute for CSS variables
  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const colors = {
    dark: 'var(--foreground)',
    purple: 'var(--accent)',
    mint: 'var(--background)',
    sage: 'var(--muted)'
  };

  const overlays: { [key: string]: string } = {
    none: 'rgba(0,0,0,0)',
    yellow: 'rgba(255, 251, 230, 0.5)',
    blue: 'rgba(230, 244, 255, 0.5)',
    pink: 'rgba(255, 240, 245, 0.5)',
    green: 'rgba(240, 255, 244, 0.5)'
  };

  const fontSizes: { [key: string]: string } = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
    xxlarge: 'text-2xl'
  };

  const textColors: { [key: string]: string } = {
    default: 'var(--foreground)',
    highContrast: '#fff',
    softBlack: '#2C3E50',
    warmGray: '#4A4A4A',
    coolGray: '#546E7A'
  };

  const backgroundColors: { [key: string]: string } = {
    default: 'var(--background)',
    white: '#FFFFFF',
    cream: '#FFF8E7',
    softBlue: '#E8F4F8',
    lightGray: '#F5F5F5',
    beige: '#F5F1E8'
  };

  const lineSpacings: { [key: string]: string } = {
    compact: '1.3',
    normal: '1.5',
    relaxed: '1.8',
    loose: '2.1'
  };

  const letterSpacings: { [key: string]: string } = {
    tight: '-0.02em',
    normal: '0',
    relaxed: '0.05em',
    wide: '0.1em'
  };

  const fontWeights: { [key: string]: string } = {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  };

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setTranscriptProgress((prev) => {
          if (prev >= 100) {
            setIsListening(false);
            return 0;
          }
          return prev + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isListening]);

  const applyOverlay = () => {
    return { backgroundColor: overlays[customization.overlay] };
  };

  const getFontClass = () => {
    if (customization.font === 'dyslexic') return 'font-mono';
    return 'font-sans';
  };

  const sampleVideos = [
    { title: "Functions Explained Simply", channel: "Khan Academy", views: "2.3M", topic: "functions" },
    { title: "Linear Functions Made Easy", channel: "The Organic Chemistry Tutor", views: "890K", topic: "functions" },
    { title: "Understanding Function Notation", channel: "Professor Leonard", views: "456K", topic: "functions" }
  ];

  // Compute dynamic styles for accessibility
  const mainContentStyle: React.CSSProperties = {
    backgroundColor: backgroundColors[customization.backgroundColor],
    color: textColors[customization.textColor],
    fontFamily: customization.font === 'dyslexic' ? 'Comic Sans MS, Arial, sans-serif' : 'Arial, Helvetica, sans-serif',
    fontSize: fontSizes[customization.fontSize]?.replace('text-', '').replace('base', '1rem').replace('sm', '0.875rem').replace('lg', '1.125rem').replace('xl', '1.25rem').replace('2xl', '1.5rem'),
    lineHeight: lineSpacings[customization.lineSpacing],
    letterSpacing: letterSpacings[customization.letterSpacing],
    fontWeight: fontWeights[customization.fontWeight],
    position: 'relative',
    minHeight: '100vh',
    transition: 'all 0.3s ease',
  };

  // Helper for colorblind filter class
  const colorblindClass = customization.colorblindMode !== 'none' ? `colorblind-${customization.colorblindMode}` : '';

  return (
    <>
      {colorblindSVGFilters}
      <div
      className={`min-h-screen ${customization.backgroundPattern !== 'none' ? `pattern-${customization.backgroundPattern}` : ''}`}
      data-theme={theme}
      style={mainContentStyle}
    >
      {/* EXPLANATION: Theme Toggle Button - Switches between light and dark mode */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
        style={{ backgroundColor: colors.purple, color: 'var(--foreground)', zIndex: 10 }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* EXPLANATION: Show sun icon in dark mode, moon icon in light mode */}
        {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>
      
      {/* Accessibility Customizer Panel */}
      <button
        onClick={() => setShowCustomizer(!showCustomizer)}
        className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
        style={{ backgroundColor: colors.purple, color: colors.dark, zIndex: 10 }}
        aria-label="Open accessibility settings"
      >
        <Settings className="w-6 h-6" />
      </button>

      {showCustomizer && (
        <div className="fixed top-20 right-4 z-50 p-6 rounded-xl shadow-2xl w-80 border-2" style={{ backgroundColor: colors.mint, borderColor: colors.purple, color: 'var(--foreground)', zIndex: 20 }}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Eye className="w-5 h-5" />
            Accessibility Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold" style={{ color: colors.sage }}>
                <Palette className="w-4 h-4 inline mr-2" />
                Color Overlay
              </label>
              <select
                value={customization.overlay}
                onChange={(e) => setCustomization({...customization, overlay: e.target.value})}
                className="w-full p-2 rounded border-2"
                style={{ borderColor: colors.purple, backgroundColor: colors.mint }}
              >
                <option value="none">None</option>
                <option value="yellow">Yellow (Reduce Glare)</option>
                <option value="blue">Blue (Calm)</option>
                <option value="pink">Pink (Warm)</option>
                <option value="green">Green (Natural)</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold" style={{ color: colors.sage }}>
                <Type className="w-4 h-4 inline mr-2" />
                Font Size
              </label>
              <select
                value={customization.fontSize}
                onChange={(e) => setCustomization({...customization, fontSize: e.target.value})}
                className="w-full p-2 rounded border-2"
                style={{ borderColor: colors.purple, backgroundColor: colors.mint }}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xlarge">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold" style={{ color: colors.sage }}>
                <Type className="w-4 h-4 inline mr-2" />
                Font Style
              </label>
              <select
                value={customization.font}
                onChange={(e) => setCustomization({...customization, font: e.target.value})}
                className="w-full p-2 rounded border-2"
                style={{ borderColor: colors.purple, backgroundColor: colors.mint }}
              >
                <option value="default">Default</option>
                <option value="dyslexic">Dyslexia-Friendly</option>
              </select>
            </div>
            {/* EXPLANATION: Background Pattern Selector
                  Allows users to choose subtle background patterns
                  Patterns are designed to be very light and not distract from reading */}
              <div>
                <label className="block mb-2 font-semibold" style={{ color: colors.sage }}>
                  <Palette className="w-4 h-4 inline mr-2" />
                  Background Pattern
                </label>
                <select
                  value={customization.backgroundPattern}
                  onChange={(e) => setCustomization({...customization, backgroundPattern: e.target.value})}
                  className="w-full p-2 rounded border-2"
                  style={{ borderColor: colors.purple, backgroundColor: colors.mint }}
                >
                  <option value="none">None (Plain)</option>
                  <option value="dots">Subtle Dots</option>
                  <option value="stripes">Subtle Stripes</option>
                  <option value="grid">Subtle Grid</option>
                  <option value="waves">Gentle Waves</option>
                  <option value="crosshatch">Crosshatch</option>
                </select>
              </div>
            <div>
              <label className="block mb-2 font-semibold" style={{ color: colors.sage }}>
                <Eye className="w-4 h-4 inline mr-2" />
                Colorblind Mode
              </label>
              <select
                value={customization.colorblindMode}
                onChange={(e) => setCustomization({...customization, colorblindMode: e.target.value})}
                className="w-full p-2 rounded border-2"
                style={{ borderColor: colors.purple, backgroundColor: colors.mint }}
              >
                <option value="none">None</option>
                <option value="protanopia">Protanopia</option>
                <option value="deuteranopia">Deuteranopia</option>
                <option value="tritanopia">Tritanopia</option>
              </select>
            </div>
             {/* 🆕 ADD THIS ENTIRE RESET BUTTON SECTION BELOW ⬇️ */}
              {/* EXPLANATION: Reset Button - Returns all settings back to default */}
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
                  backgroundPattern: 'none'
                })}
                className="w-full p-3 rounded-lg font-semibold hover:scale-105 transition-transform"
                style={{ backgroundColor: colors.sage, color: colors.mint }}
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
              {/* Echo waves emanating */}
              <circle cx="35" cy="35" r="10" fill={colors.purple} opacity="0.3" className="animate-ping" />
              <circle cx="35" cy="35" r="15" fill="none" stroke={colors.purple} strokeWidth="2" opacity="0.6" />
              <circle cx="35" cy="35" r="20" fill="none" stroke={colors.purple} strokeWidth="2" opacity="0.4" />
              <circle cx="35" cy="35" r="25" fill="none" stroke={colors.purple} strokeWidth="2" opacity="0.2" />
              
              {/* Microphone/speaker icon */}
              <circle cx="35" cy="35" r="8" fill={colors.dark} />
              <rect x="32" y="30" width="6" height="12" fill={colors.mint} rx="3" />
              
              {/* Note paper */}
              <rect x="55" y="20" width="30" height="30" fill={colors.mint} stroke={colors.dark} strokeWidth="2" rx="2" />
              <line x1="60" y1="27" x2="80" y2="27" stroke={colors.sage} strokeWidth="2" />
              <line x1="60" y1="33" x2="80" y2="33" stroke={colors.sage} strokeWidth="2" />
              <line x1="60" y1="39" x2="75" y2="39" stroke={colors.sage} strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="text-center mb-16">
          <h1 className="text-7xl font-bold mb-3 tracking-tight" style={{ color: 'var(--foreground)' }}>
            Echo<span style={{ color: colors.purple }}>Notes</span>
          </h1>
          <p className="text-2xl font-medium" style={{ color: colors.sage }}>
            Making learning clearer for everyone
          </p>
        </div>

        {/* Main Live Listening Demo - HERO FEATURE */}
        <div className="max-w-5xl mx-auto mb-16 rounded-2xl shadow-2xl overflow-hidden border-4" style={{ borderColor: colors.purple }}>
          <div className="p-8" style={{ backgroundColor: colors.dark, color: 'var(--foreground)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.mint }}>
                <Mic className={`w-8 h-8 ${isListening ? 'animate-pulse' : ''}`} style={{ color: colors.purple }} />
                Live Lecture Listening
              </h2>
              <button
                onClick={() => setIsListening(!isListening)}
                className="px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                style={{ backgroundColor: isListening ? colors.sage : colors.purple, color: colors.dark }}
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

            {/* Waveform Visualization */}
            {isListening && (
              <div className="flex items-center justify-center gap-1 mb-6 h-16">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full transition-all"
                    style={{
                      backgroundColor: colors.purple,
                      height: `${Math.random() * 100}%`,
                      animation: 'pulse 0.5s ease-in-out infinite',
                      animationDelay: `${i * 0.05}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Live Transcript */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original Audio */}
              <div className={`p-6 rounded-xl relative ${colorblindClass}`} style={{ backgroundColor: colors.sage }}>
                {/* Overlay for this section only */}
                {customization.overlay !== 'none' && (
                  <div
                    aria-hidden="true"
                    style={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      zIndex: 2,
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: overlays[customization.overlay],
                      borderRadius: 'inherit',
                      transition: 'background-color 0.3s ease',
                    }}
                  />
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Headphones className="w-5 h-5" style={{ color: colors.mint }} />
                  <h3 className="font-bold" style={{ color: colors.mint }}>What You're Hearing</h3>
                </div>
                <p className="leading-relaxed" style={{ color: colors.mint }}>
                  {transcriptProgress > 20 && "In calculus, a function represents a relationship where... "}
                  {transcriptProgress > 40 && "each input corresponds to exactly one output. "}
                  {transcriptProgress > 60 && "We use function notation f(x) to denote... "}
                  {transcriptProgress > 80 && "the dependent variable's value for input x."}
                </p>
              </div>

              {/* Simplified Notes */}
              <div className={`p-6 rounded-xl relative ${colorblindClass}`} style={{ backgroundColor: colors.mint }}>
                {/* Overlay for this section only */}
                {customization.overlay !== 'none' && (
                  <div
                    aria-hidden="true"
                    style={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      zIndex: 2,
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: overlays[customization.overlay],
                      borderRadius: 'inherit',
                      transition: 'background-color 0.3s ease',
                    }}
                  />
                )}
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                  <h3 className="font-bold" style={{ color: 'var(--foreground)' }}>Your Clear Notes</h3>
                </div>
                <p className="leading-relaxed" style={{ color: 'var(--foreground)' }}>
                  {transcriptProgress > 20 && "📝 A function is like a machine: "}
                  {transcriptProgress > 40 && "you put one number in, and get one number out. "}
                  {transcriptProgress > 60 && "We write it as f(x). "}
                  {transcriptProgress > 80 && "The 'x' is what you put in, f(x) is what comes out."}
                </p>
                {transcriptProgress > 90 && (
                  <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: colors.purple, color: 'var(--foreground)' }}>
                    <Youtube className="w-5 h-5 mt-1" style={{ color: colors.dark }} />
                    <div>
                      <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Related Study Videos Found:</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>3 videos on "functions" linked below</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isListening && (
              <div className="mt-6">
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.sage }}>
                  <div
                    className="h-full transition-all duration-200"
                    style={{ backgroundColor: colors.purple, width: `${transcriptProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Video Recommendations Section */}
          {transcriptProgress > 90 && (
            <div className="p-8" style={{ backgroundColor: colors.mint, color: 'var(--foreground)' }}>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Youtube className="w-6 h-6" style={{ color: colors.purple }} />
                Recommended Study Videos for "Functions"
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {sampleVideos.map((video, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border-2 hover:scale-105 transition-transform cursor-pointer"
                    style={{ backgroundColor: colors.mint, borderColor: colors.purple }}
                  >
                    <div className="w-full h-32 rounded mb-3 flex items-center justify-center" style={{ backgroundColor: colors.sage }}>
                      <Play className="w-12 h-12" style={{ color: colors.mint }} />
                    </div>
                    <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}>{video.title}</h4>
                    <p className="text-sm mb-1" style={{ color: colors.sage }}>{video.channel}</p>
                    <p className="text-sm" style={{ color: colors.sage }}>{video.views} views</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center mb-12" style={{ color: 'var(--foreground)' }}>
            How EchoNotes Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: colors.purple }}>
                <Mic className="w-10 h-10" style={{ color: colors.dark }} />
              </div>
              <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--foreground)' }}>1. Listen</h3>
              <p style={{ color: colors.sage }}>
                EchoNotes captures your lecture audio in real-time or from recordings
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: colors.purple }}>
                <Brain className="w-10 h-10" style={{ color: colors.dark }} />
              </div>
              <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--foreground)' }}>2. Simplify</h3>
              <p style={{ color: colors.sage }}>
                Complex jargon is automatically translated into clear, plain language
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: colors.purple }}>
                <Video className="w-10 h-10" style={{ color: colors.dark }} />
              </div>
              <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--foreground)' }}>3. Connect</h3>
              <p style={{ color: colors.sage }}>
                Relevant YouTube study videos are linked to specific topics mentioned
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="px-12 py-5 rounded-xl font-bold text-xl shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto" style={{ backgroundColor: colors.purple, color: 'var(--foreground)' }}>
            <Sparkles className="w-6 h-6" />
            Try EchoNotes Now
          </button>
          <p className="mt-6 text-lg" style={{ color: colors.sage }}>
            Making learning clearer for everyone
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

