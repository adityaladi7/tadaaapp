import React, { useState } from 'react';
import {
  Smartphone,
  ShieldAlert,
  Wallet,
  Mic,
  MapPin,
  Music,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ScreenType } from '../types';
import { getConfidenceWins } from '../utils/storage';
import { audioService } from '../utils/audioService';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const [wins] = useState(() => getConfidenceWins());
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Confidence count
  const winCount = wins.length;

  const toggleAudio = () => {
    if (isAudioMuted) {
      setIsAudioMuted(false);
      audioService.speak('Sound is on. Tada will read answers aloud to you.');
    } else {
      audioService.stopSpeaking();
      setIsAudioMuted(true);
    }
  };

  const handleCelebrateLedger = () => {
    audioService.playTadaChime();
    audioService.triggerConfetti();
    audioService.speak(
      `Wonderful! You have done ${winCount} things completely on your own this week. Tada is proud of you!`
    );
  };

  const handleSelect = (screen: ScreenType, spokenAnnouncement: string) => {
    if (!isAudioMuted) {
      audioService.speak(spokenAnnouncement);
    }
    onNavigate(screen);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-6">
      {/* Top Banner (Warm, clear, no distracting menus) */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b-2 border-amber-200/80">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md border-2 border-amber-200">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-display">
              Tada
            </h1>
            <p className="text-lg sm:text-xl text-stone-700 font-medium">
              You can do it yourself. I'll stand next to you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sound"
            onClick={toggleAudio}
            aria-label={isAudioMuted ? 'Turn on voice reading' : 'Mute voice reading'}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-stone-800 border-2 border-amber-300 font-semibold min-h-[48px] transition-colors"
          >
            {isAudioMuted ? (
              <>
                <VolumeX className="w-5 h-5 text-stone-600" />
                <span className="text-sm">Voice Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-amber-700 animate-pulse" />
                <span className="text-sm text-amber-950 font-bold">Voice On</span>
              </>
            )}
          </button>
          <PWAInstallButton />
        </div>
      </header>

      {/* THE CONFIDENCE LEDGER (The Product's Soul) */}
      <section
        id="confidence-ledger"
        aria-label="Confidence Ledger"
        onClick={handleCelebrateLedger}
        className="w-full rounded-3xl bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 p-6 sm:p-7 border-3 border-amber-300 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 cursor-pointer hover:border-amber-400 transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-inner shrink-0">
            <Sparkles className="w-9 h-9 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
          <div>
            <span className="text-xs sm:text-sm uppercase tracking-wider font-bold text-amber-800 block mb-0.5">
              Your Confidence Ledger
            </span>
            <p className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug font-display">
              Things you did on your own this week
            </p>
            <p className="text-sm sm:text-base text-stone-600 mt-1">
              Tap anytime to celebrate your wins!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#FFFDF7] px-6 py-3 rounded-2xl border-2 border-amber-300 shadow-xs">
          <span className="text-4xl sm:text-5xl font-black text-amber-700 font-display">
            {winCount}
          </span>
          <span className="text-lg font-bold text-stone-800 leading-tight">
            Wins<br />celebrated
          </span>
        </div>
      </section>

      {/* THE SIX LARGE ICON BUTTONS ONLY (Strictly No Tab Bar, No Hamburger) */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* 1. I'm stuck on a screen */}
        <button
          id="btn-stuck-screen"
          onClick={() =>
            handleSelect('SCREEN_COACH', "I am opening the screen helper. Let's look at your screen together.")
          }
          className="group w-full min-h-[110px] p-6 rounded-3xl bg-[#FFFDF7] hover:bg-amber-50/70 border-3 border-stone-300 hover:border-amber-500 text-left shadow-md hover:shadow-lg transition-all flex items-center gap-5 active:scale-[0.98]"
        >
          <div className="w-18 h-18 rounded-2xl bg-amber-500 group-hover:bg-amber-600 text-stone-950 flex items-center justify-center shrink-0 shadow-sm transition-colors">
            <Smartphone className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-stone-900 group-hover:text-amber-950 font-display leading-tight">
              1. I'm stuck on a screen
            </h2>
            <p className="text-lg text-stone-700 mt-1">
              Show camera to see which one button to press
            </p>
          </div>
        </button>

        {/* 2. Is this safe to pay? */}
        <button
          id="btn-safe-to-pay"
          onClick={() =>
            handleSelect('SAFETY_CHECKER', 'Opening safety checker. Paste or speak any message before you pay.')
          }
          className="group w-full min-h-[110px] p-6 rounded-3xl bg-[#FFFDF7] hover:bg-amber-50/70 border-3 border-stone-300 hover:border-amber-500 text-left shadow-md hover:shadow-lg transition-all flex items-center gap-5 active:scale-[0.98]"
        >
          <div className="w-18 h-18 rounded-2xl bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-colors">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-stone-900 group-hover:text-amber-950 font-display leading-tight">
              2. Is this safe to pay?
            </h2>
            <p className="text-lg text-stone-700 mt-1">
              Check SMS or UPI request for fraud before paying
            </p>
          </div>
        </button>

        {/* 3. Practice room */}
        <button
          id="btn-practice-room"
          onClick={() =>
            handleSelect('PRACTICE_ROOM', 'Welcome to the practice room. Nothing real can go wrong here.')
          }
          className="group w-full min-h-[110px] p-6 rounded-3xl bg-[#FFFDF7] hover:bg-amber-50/70 border-3 border-stone-300 hover:border-amber-500 text-left shadow-md hover:shadow-lg transition-all flex items-center gap-5 active:scale-[0.98]"
        >
          <div className="w-18 h-18 rounded-2xl bg-sky-600 group-hover:bg-sky-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-colors">
            <Wallet className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-stone-900 group-hover:text-amber-950 font-display leading-tight">
              3. Practice room
            </h2>
            <p className="text-lg text-stone-700 mt-1">
              Rehearse UPI with fake ₹10,000. Zero risk.
            </p>
          </div>
        </button>

        {/* 4. Ask me anything */}
        <button
          id="btn-voice-assistant"
          onClick={() =>
            handleSelect('VOICE_AGENT', 'Namaste! Ask me anything. I am listening patiently.')
          }
          className="group w-full min-h-[110px] p-6 rounded-3xl bg-[#FFFDF7] hover:bg-amber-50/70 border-3 border-stone-300 hover:border-amber-500 text-left shadow-md hover:shadow-lg transition-all flex items-center gap-5 active:scale-[0.98]"
        >
          <div className="w-18 h-18 rounded-2xl bg-amber-600 group-hover:bg-amber-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-colors">
            <Mic className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-stone-900 group-hover:text-amber-950 font-display leading-tight">
              4. Ask me anything
            </h2>
            <p className="text-lg text-stone-700 mt-1">
              Talk by voice. I can control the app for you.
            </p>
          </div>
        </button>

        {/* 5. I'm out & need help */}
        <button
          id="btn-out-need-help"
          onClick={() =>
            handleSelect('HELP_OUT', "Opening help for when you are outside. Chemist, hospital, and directions home.")
          }
          className="group w-full min-h-[110px] p-6 rounded-3xl bg-[#FFFDF7] hover:bg-amber-50/70 border-3 border-stone-300 hover:border-amber-500 text-left shadow-md hover:shadow-lg transition-all flex items-center gap-5 active:scale-[0.98]"
        >
          <div className="w-18 h-18 rounded-2xl bg-rose-600 group-hover:bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-colors">
            <MapPin className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-stone-900 group-hover:text-amber-950 font-display leading-tight">
              5. I'm out & need help
            </h2>
            <p className="text-lg text-stone-700 mt-1">
              Chemist, Hospital, Take Me Home, SOS & family
            </p>
          </div>
        </button>

        {/* 6. Music & memories */}
        <button
          id="btn-music-memories"
          onClick={() =>
            handleSelect('MUSIC_MEMORIES', 'Opening music and memories. Relax with 80s songs and stories for grandchildren.')
          }
          className="group w-full min-h-[110px] p-6 rounded-3xl bg-[#FFFDF7] hover:bg-amber-50/70 border-3 border-stone-300 hover:border-amber-500 text-left shadow-md hover:shadow-lg transition-all flex items-center gap-5 active:scale-[0.98]"
        >
          <div className="w-18 h-18 rounded-2xl bg-purple-600 group-hover:bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-colors">
            <Music className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-stone-900 group-hover:text-amber-950 font-display leading-tight">
              6. Music & memories
            </h2>
            <p className="text-lg text-stone-700 mt-1">
              1980s, Rafi, Bhajans + share stories with grandchildren
            </p>
          </div>
        </button>
      </main>

      {/* Gentle reassurance footer */}
      <footer className="mt-2 text-center text-stone-600 text-base font-medium py-2">
        <p>Tada protects your privacy. No personal data leaves your device.</p>
      </footer>
    </div>
  );
};
