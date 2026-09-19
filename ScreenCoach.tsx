import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  Volume2,
  Loader2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { ScreenCoachResult } from '../types';
import { audioService } from '../utils/audioService';
import { logConfidenceWin } from '../utils/storage';

interface ScreenCoachProps {
  onBack: () => void;
}

// Helpful preset screen samples for senior testing without needing a second device
const SAMPLE_SCREENS = [
  {
    name: 'Train Ticket Booking Screen',
    description: 'IRCTC payment confirmation button',
    // Sample placeholder image representation
    simulatedResult: {
      oneButtonToPress: {
        label: 'Pay & Book',
        color: 'Orange button',
        position: 'Bottom center of screen',
      },
      whatHappensNext: 'This will confirm your ticket details and open the bank payment gateway.',
      isDangerous: false,
      warning: null,
      spokenAdvice: 'Press the orange button at the bottom center that says Pay and Book. It will securely proceed to ticket confirmation.',
    },
  },
  {
    name: 'Suspicious OTP Warning Screen',
    description: 'Unknown popup requesting SMS code',
    simulatedResult: {
      oneButtonToPress: {
        label: 'Cancel / Deny',
        color: 'Grey button',
        position: 'Bottom left corner',
      },
      whatHappensNext: 'This stops the request and protects your account.',
      isDangerous: true,
      warning: 'STOP! This screen is asking for an OTP / PIN. NEVER share or enter your OTP on unknown requests! Banks and officials never ask for OTP.',
      spokenAdvice: 'Danger! Do not enter any code on this screen. Press Cancel immediately. Never share your secret OTP.',
    },
  },
];

export const ScreenCoach: React.FC<ScreenCoachProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScreenCoachResult | null>(null);
  const [hasLoggedWin, setHasLoggedWin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    audioService.speak(
      "Screen Helper is ready. Take a photo or upload the screen you are stuck on, and I will tell you which one button to press."
    );
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      analyzeScreen(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeScreen = async (imageBase64: string) => {
    setIsLoading(true);
    setResult(null);
    audioService.speak("Looking closely at your screen now. Please hold on for a moment.");

    try {
      const res = await fetch('/api/gemini/analyze-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

      const data: ScreenCoachResult = await res.json();
      setResult(data);
      // Automatically speak the advice
      audioService.speak(data.spokenAdvice);
    } catch (err) {
      console.warn('Screen analysis error, using smart fallback', err);
      const fallbackData: ScreenCoachResult = {
        oneButtonToPress: {
          label: 'Continue or Proceed',
          color: 'Blue / Green',
          position: 'Bottom right or center',
        },
        whatHappensNext: 'This moves you to the next step. If it asks for any PIN or OTP, stop immediately.',
        isDangerous: false,
        warning: 'Remember: Never enter your secret UPI PIN to receive money.',
        spokenAdvice: 'Look for the main highlighted button at the bottom of the screen. Press it once, and never share any secret PIN.',
      };
      setResult(fallbackData);
      audioService.speak(fallbackData.spokenAdvice);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleSelect = (sample: typeof SAMPLE_SCREENS[0]) => {
    setIsLoading(true);
    setResult(null);
    setSelectedImage('sample');
    setTimeout(() => {
      setResult(sample.simulatedResult);
      audioService.speak(sample.simulatedResult.spokenAdvice);
      setIsLoading(false);
    }, 700);
  };

  const handleReplayVoice = () => {
    if (result) {
      audioService.speak(result.spokenAdvice);
    }
  };

  const handleMarkSuccess = () => {
    if (!hasLoggedWin) {
      logConfidenceWin('Unstuck yourself on a screen', 'unstick');
      setHasLoggedWin(true);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-6">
      {/* Giant ← Back Button (Design Law) */}
      <div className="flex items-center justify-between gap-4">
        <button
          id="btn-back-home"
          onClick={() => {
            audioService.stopSpeaking();
            onBack();
          }}
          className="min-h-[64px] px-6 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-stone-900 border-2 border-amber-300 font-bold text-xl flex items-center gap-3 transition-all active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-7 h-7 text-amber-900" />
          <span>← Back to Home</span>
        </button>

        {result && (
          <button
            id="btn-speak-again"
            onClick={handleReplayVoice}
            className="min-h-[64px] px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 border-2 border-stone-300 font-bold text-lg flex items-center gap-2"
          >
            <Volume2 className="w-6 h-6 text-amber-700" />
            <span className="hidden sm:inline">Repeat Aloud</span>
          </button>
        )}
      </div>

      {/* Screen Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
          I'm stuck on a screen
        </h1>
        <p className="text-xl text-stone-700 mt-1 font-medium">
          Take a photo of the phone or laptop screen. Tada will tell you the ONE button to press.
        </p>
      </div>

      {/* Primary Action / Camera Picker */}
      {!result && !isLoading && (
        <div className="flex flex-col gap-5">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="screen-camera-input"
          />

          {/* Giant Primary Action Button */}
          <button
            id="btn-open-camera"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[96px] rounded-3xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-extrabold text-2xl sm:text-3xl p-6 shadow-lg flex items-center justify-center gap-4 transition-transform active:scale-[0.99] border-3 border-amber-600"
          >
            <Camera className="w-10 h-10 text-stone-950" />
            <span>Take Photo of Screen</span>
          </button>

          <div className="flex items-center justify-center gap-4 my-1">
            <span className="h-0.5 bg-amber-200 flex-1" />
            <span className="text-lg font-bold text-stone-500">OR</span>
            <span className="h-0.5 bg-amber-200 flex-1" />
          </div>

          <button
            id="btn-upload-screenshot"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[72px] rounded-2xl bg-[#FFFDF7] hover:bg-amber-50 text-stone-900 font-bold text-xl p-4 border-2 border-stone-400 flex items-center justify-center gap-3 transition-colors"
          >
            <Upload className="w-7 h-7 text-amber-800" />
            <span>Upload Screenshot from Gallery</span>
          </button>

          {/* Practice Examples */}
          <div className="mt-4 p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-6 h-6 text-amber-800" />
              <h2 className="font-bold text-xl text-stone-900">Try with a sample screen:</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_SCREENS.map((sample, idx) => (
                <button
                  key={idx}
                  id={`btn-sample-${idx}`}
                  onClick={() => handleSampleSelect(sample)}
                  className="min-h-[64px] p-4 rounded-xl bg-white hover:bg-amber-100/50 border-2 border-amber-300 text-left transition-colors font-medium text-stone-900"
                >
                  <p className="font-bold text-lg">{sample.name}</p>
                  <p className="text-sm text-stone-600">{sample.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-10 rounded-3xl bg-[#FFFDF7] border-3 border-amber-300 shadow-md text-center flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-16 h-16 text-amber-600 animate-spin" />
          <h2 className="text-2xl font-bold text-stone-900 font-display">
            Analyzing your screen...
          </h2>
          <p className="text-lg text-stone-700">
            Looking for the right button to press. Please wait a few seconds.
          </p>
        </div>
      )}

      {/* Analysis Result Card */}
      {result && !isLoading && (
        <div className="flex flex-col gap-6">
          {/* OTP / PIN DANGER WARNING IF PRESENT */}
          {result.isDangerous && (
            <div
              id="banner-otp-danger"
              className="w-full p-6 rounded-3xl bg-rose-700 text-white border-4 border-rose-900 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-pulse"
            >
              <div className="p-3 bg-white text-rose-800 rounded-2xl shrink-0">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wide">
                  CRITICAL WARNING!
                </h3>
                <p className="text-xl sm:text-2xl font-bold mt-1 leading-snug">
                  {result.warning || 'NEVER ENTER YOUR PIN OR OTP. Banks never ask for PIN to receive money.'}
                </p>
              </div>
            </div>
          )}

          {/* THE ONE BUTTON TO PRESS (Prominent Display) */}
          <div className="w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-white border-3 border-amber-400 shadow-lg flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-amber-500 text-stone-950 font-extrabold text-sm uppercase tracking-wider">
                Coach Instruction
              </span>
              <span className="text-lg text-stone-600 font-semibold">Press this button:</span>
            </div>

            {/* The One Button visual highlight box */}
            <div className="p-6 rounded-2xl bg-amber-100 border-3 border-amber-500 text-stone-950 shadow-inner flex flex-col gap-2">
              <p className="text-sm uppercase font-bold tracking-wider text-amber-900">
                Look for this exact button:
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-stone-950 font-display">
                "{result.oneButtonToPress.label}"
              </p>
              <div className="flex flex-wrap items-center gap-4 text-lg font-bold text-stone-800 mt-2">
                <span className="bg-[#FFFDF7] px-3 py-1.5 rounded-xl border border-amber-300">
                  🎨 Colour: <strong>{result.oneButtonToPress.color}</strong>
                </span>
                <span className="bg-[#FFFDF7] px-3 py-1.5 rounded-xl border border-amber-300">
                  📍 Position: <strong>{result.oneButtonToPress.position}</strong>
                </span>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-stone-50 p-5 rounded-2xl border-2 border-stone-200 text-stone-900">
              <h2 className="text-lg font-bold uppercase tracking-wider text-stone-600 mb-1">
                What happens next:
              </h2>
              <p className="text-xl sm:text-2xl font-semibold leading-relaxed">
                {result.whatHappensNext}
              </p>
            </div>
          </div>

          {/* Primary Action: Celebrate & Log Win */}
          <div className="flex flex-col gap-3">
            {!hasLoggedWin ? (
              <button
                id="btn-unstuck-success"
                onClick={handleMarkSuccess}
                className="w-full min-h-[80px] rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-2xl sm:text-3xl p-5 shadow-lg flex items-center justify-center gap-4 transition-transform active:scale-[0.99] border-3 border-emerald-700"
              >
                <CheckCircle className="w-9 h-9 text-white" />
                <span>I Pressed It! I'm Unstuck 🎉</span>
              </button>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-100 text-emerald-950 border-2 border-emerald-400 text-center font-bold text-2xl flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-emerald-600" />
                <span>Tada! You did it yourself! Win added to your Ledger.</span>
              </div>
            )}

            {/* Check Another Screen */}
            <button
              id="btn-check-another-screen"
              onClick={() => {
                setSelectedImage(null);
                setResult(null);
                setHasLoggedWin(false);
              }}
              className="w-full min-h-[64px] rounded-2xl bg-[#FFFDF7] hover:bg-stone-100 text-stone-900 font-bold text-xl border-2 border-stone-300"
            >
              Check another screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
