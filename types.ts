export type ScreenType =
  | 'HOME'
  | 'SCREEN_COACH'
  | 'SAFETY_CHECKER'
  | 'PRACTICE_ROOM'
  | 'VOICE_AGENT'
  | 'HELP_OUT'
  | 'MUSIC_MEMORIES';

export interface ConfidenceWin {
  id: string;
  timestamp: number;
  title: string;
  category: 'unstick' | 'safety_check' | 'practice' | 'navigation' | 'voice';
}

export interface UserProfile {
  familyPhone: string;
  familyName: string;
  homeAddress: string;
  walletBalance: number;
}

export interface ScreenCoachResult {
  oneButtonToPress: {
    label: string;
    color: string;
    position: string;
  };
  whatHappensNext: string;
  isDangerous: boolean;
  warning: string | null;
  spokenAdvice: string;
}

export interface FraudCheckResult {
  verdict: 'SAFE' | 'BE CAREFUL' | 'LIKELY FRAUD';
  why: string;
  oneInstruction: string;
  helpline: string;
  spokenAdvice: string;
}

export interface PracticeScenario {
  id: string;
  title: string;
  sender: string;
  message: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }>;
  lesson: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  era: '1980s' | '1990s' | 'rafi' | 'bhajans';
  description: string;
  raga: string;
}

export interface GrandchildPrompt {
  topic: string;
  prompt: string;
  questionToAsk: string;
}
