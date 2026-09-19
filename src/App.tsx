import React, { useState } from 'react';
import { ScreenType } from './types';
import { HomeScreen } from './components/HomeScreen';
import { ScreenCoach } from './components/ScreenCoach';
import { SafetyChecker } from './components/SafetyChecker';
import { PracticeRoom } from './components/PracticeRoom';
import { VoiceAgent } from './components/VoiceAgent';
import { HelpOut } from './components/HelpOut';
import { MusicMemories } from './components/MusicMemories';
import { OfflineBanner } from './components/OfflineBanner';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('HOME');
  const [navigationPayload, setNavigationPayload] = useState<any>(null);

  const handleNavigate = (screen: ScreenType, payload?: any) => {
    setNavigationPayload(payload || null);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setNavigationPayload(null);
    setCurrentScreen('HOME');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#1A1816] font-sans flex flex-col selection:bg-amber-200">
      {/* Active Screen View */}
      <div className="flex-1 w-full pb-12">
        {currentScreen === 'HOME' && <HomeScreen onNavigate={handleNavigate} />}

        {currentScreen === 'SCREEN_COACH' && (
          <ScreenCoach onBack={handleBackToHome} />
        )}

        {currentScreen === 'SAFETY_CHECKER' && (
          <SafetyChecker
            onBack={handleBackToHome}
            initialText={navigationPayload?.initialText || ''}
          />
        )}

        {currentScreen === 'PRACTICE_ROOM' && (
          <PracticeRoom onBack={handleBackToHome} />
        )}

        {currentScreen === 'VOICE_AGENT' && (
          <VoiceAgent onBack={handleBackToHome} onNavigate={handleNavigate} />
        )}

        {currentScreen === 'HELP_OUT' && (
          <HelpOut onBack={handleBackToHome} />
        )}

        {currentScreen === 'MUSIC_MEMORIES' && (
          <MusicMemories onBack={handleBackToHome} />
        )}
      </div>

      {/* Persistent Offline Status Banner if network drops */}
      <OfflineBanner />
    </div>
  );
}
