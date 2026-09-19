import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Music,
  Play,
  Square,
  Sparkles,
  Share2,
  Volume2,
  Radio,
  Heart,
  RefreshCw,
} from 'lucide-react';
import { GrandchildPrompt } from '../types';
import { audioService } from '../utils/audioService';
import { getUserProfile, logConfidenceWin } from '../utils/storage';

interface MusicMemoriesProps {
  onBack: () => void;
}

const CHANNELS = [
  {
    id: '1980s' as const,
    title: '1980s Bollywood Classics',
    subtitle: 'Kishore Kumar, Asha Bhosle, RD Burman',
    raga: 'Raga Yaman / Peelu melody',
    color: 'from-amber-600 to-amber-800',
  },
  {
    id: '1990s' as const,
    title: '1990s Golden Melodies',
    subtitle: 'Kumar Sanu, Alka Yagnik, Udit Narayan',
    raga: 'Raga Khamaj / Pahadi romance',
    color: 'from-rose-600 to-rose-800',
  },
  {
    id: 'rafi' as const,
    title: 'Mohd Rafi Immortal Hits',
    subtitle: 'Soulful ghazals & timeless Bollywood',
    raga: 'Raga Darbari / Bageshri',
    color: 'from-purple-700 to-indigo-900',
  },
  {
    id: 'bhajans' as const,
    title: 'Peaceful Morning Bhajans',
    subtitle: 'Anup Jalota, MS Subbulakshmi, Vedic chants',
    raga: 'Raga Bhairav / Morning awakening',
    color: 'from-amber-500 to-orange-700',
  },
];

const MEMORY_PROMPTS: GrandchildPrompt[] = [
  {
    topic: 'Your First Bicycle',
    prompt:
      'Remember the first bicycle you or your family owned? The shiny bell, the bumpy roads, and learning to balance.',
    questionToAsk:
      'Beta, did you know how I got my very first bicycle when I was your age? Let me tell you the story...',
  },
  {
    topic: 'Sunday Radio & Family Meals',
    prompt:
      'Remember waiting for Binaca Geetmala on the radio while the house smelled of fresh ginger chai and warm rotis?',
    questionToAsk:
      'Beta, when I was growing up, we gathered around one radio every week to listen to songs together...',
  },
  {
    topic: 'First Time in a Cinema Hall',
    prompt:
      'The big curtain slowly parting, the interval samosa, and cheering for the hero with hundreds of people.',
    questionToAsk:
      'Beta, do you want to hear what going to a cinema hall was like before smartphones existed?',
  },
  {
    topic: 'Monsoon Rain & Paper Boats',
    prompt:
      'Making paper boats out of old school notebook pages and floating them in rainwater puddles outside your gate.',
    questionToAsk:
      'Beta, on rainy days when I was little, we raced paper boats down the street with our neighbors...',
  },
];

export const MusicMemories: React.FC<MusicMemoriesProps> = ({ onBack }) => {
  const [profile] = useState(() => getUserProfile());
  const [activeChannelId, setActiveChannelId] = useState<typeof CHANNELS[0]['id'] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    audioService.speak(
      "Welcome to Music and Memories. Choose your favorite era to relax, or share a golden childhood story with your grandchild."
    );

    return () => {
      audioService.stopAmbientMusic();
      audioService.stopSpeaking();
    };
  }, []);

  const handlePlayChannel = (channel: typeof CHANNELS[0]) => {
    if (activeChannelId === channel.id && isPlaying) {
      audioService.stopAmbientMusic();
      setIsPlaying(false);
      audioService.speak('Music paused.');
      return;
    }

    setActiveChannelId(channel.id);
    setIsPlaying(true);
    audioService.speak(`Now playing peaceful melodies from ${channel.title}. Sit back and enjoy.`);

    setTimeout(() => {
      audioService.startAmbientIndianMusic(channel.id);
    }, 1500);
  };

  const handleStop = () => {
    audioService.stopAmbientMusic();
    setIsPlaying(false);
    setActiveChannelId(null);
  };

  const handleNextPrompt = () => {
    const next = (promptIndex + 1) % MEMORY_PROMPTS.length;
    setPromptIndex(next);
    audioService.speak(`Memory topic: ${MEMORY_PROMPTS[next].topic}. ${MEMORY_PROMPTS[next].prompt}`);
  };

  const handleShareOnWhatsApp = (prompt: GrandchildPrompt) => {
    const text = encodeURIComponent(
      `Namaste Beta! ❤️\n\n${prompt.questionToAsk}\n\nCall or message me whenever you are free today, I would love to tell you more!`
    );

    const cleanPhone = profile.familyPhone.replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    logConfidenceWin('Shared a childhood memory with family', 'voice');
    audioService.speak('Opening WhatsApp to share this lovely memory with your family.');
    window.open(waUrl, '_blank');
  };

  const currentPrompt = MEMORY_PROMPTS[promptIndex];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-6">
      {/* Giant ← Back Button (Design Law) */}
      <div className="flex items-center justify-between gap-4">
        <button
          id="btn-back-home"
          onClick={() => {
            audioService.stopAmbientMusic();
            audioService.stopSpeaking();
            onBack();
          }}
          className="min-h-[64px] px-6 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-stone-900 border-2 border-amber-300 font-bold text-xl flex items-center gap-3 transition-all active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-7 h-7 text-amber-900" />
          <span>← Back to Home</span>
        </button>

        {isPlaying && (
          <button
            id="btn-stop-music"
            onClick={handleStop}
            className="min-h-[64px] px-5 py-3 rounded-2xl bg-stone-900 text-amber-400 font-bold text-lg flex items-center gap-2"
          >
            <Square className="w-6 h-6 fill-amber-400" />
            <span>Stop Music</span>
          </button>
        )}
      </div>

      {/* Screen Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
          Music & Memories
        </h1>
        <p className="text-xl text-stone-700 mt-1 font-medium">
          Soothing melodies from your favorite eras, and stories to share with your grandchildren.
        </p>
      </div>

      {/* 1. FOUR CURATED MUSIC CHANNELS */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Radio className="w-7 h-7 text-amber-700" />
          <span>Choose Your Music Era:</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CHANNELS.map((ch) => {
            const isThisPlaying = isPlaying && activeChannelId === ch.id;
            return (
              <button
                key={ch.id}
                id={`btn-channel-${ch.id}`}
                onClick={() => handlePlayChannel(ch)}
                className={`min-h-[110px] p-5 rounded-3xl border-3 text-left transition-all shadow-md active:scale-[0.98] flex items-center gap-4 ${
                  isThisPlaying
                    ? 'bg-amber-100 border-amber-500 ring-4 ring-amber-300'
                    : 'bg-[#FFFDF7] border-stone-300 hover:border-amber-400'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    isThisPlaying
                      ? 'bg-amber-600 text-white animate-bounce'
                      : 'bg-stone-100 text-stone-800'
                  }`}
                >
                  {isThisPlaying ? <Volume2 className="w-9 h-9" /> : <Play className="w-9 h-9 ml-1" />}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-extrabold text-stone-900 font-display leading-tight">
                    {ch.title}
                  </h3>
                  <p className="text-base text-stone-600 font-medium mt-0.5">{ch.subtitle}</p>
                  <span className="inline-block text-xs uppercase font-extrabold tracking-wider text-amber-800 mt-1">
                    {ch.raga}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. GRANDCHILD MEMORY PROMPT (Soulful Connection) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-50 via-[#FFFDF7] to-amber-100/60 border-3 border-amber-400 shadow-lg flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
              <Heart className="w-7 h-7 fill-rose-600 text-rose-600" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-900 block">
                Golden Nostalgia
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display">
                Share a memory with your grandchild
              </h3>
            </div>
          </div>

          <button
            id="btn-next-memory-topic"
            onClick={handleNextPrompt}
            className="min-h-[48px] px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-stone-800 font-bold text-sm flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4 text-amber-800" />
            <span>Another Topic</span>
          </button>
        </div>

        {/* The Prompt Card */}
        <div className="p-5 rounded-2xl bg-white border-2 border-amber-300 text-stone-900 flex flex-col gap-2">
          <p className="text-sm font-extrabold uppercase tracking-wider text-amber-800">
            Topic: {currentPrompt.topic}
          </p>
          <p className="text-2xl font-bold font-display text-stone-950 leading-snug">
            "{currentPrompt.prompt}"
          </p>
        </div>

        {/* ONE Primary Action: Share on WhatsApp */}
        <button
          id="btn-share-grandchild-memory"
          onClick={() => handleShareOnWhatsApp(currentPrompt)}
          className="w-full min-h-[76px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl sm:text-3xl p-4 shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.99] border-2 border-emerald-700"
        >
          <Share2 className="w-8 h-8 text-white" />
          <span>Send Story on WhatsApp to Grandchild</span>
        </button>
      </div>
    </div>
  );
};
