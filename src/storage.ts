import { ConfidenceWin, UserProfile } from '../types';
import { audioService } from './audioService';

const LEDGER_KEY = 'tada_confidence_wins_v1';
const PROFILE_KEY = 'tada_user_profile_v1';

const DEFAULT_PROFILE: UserProfile = {
  familyPhone: '',
  familyName: 'Beta / Beti',
  homeAddress: '',
  walletBalance: 10000,
};

// Initial encouraging wins so senior citizen never sees empty zero
const DEFAULT_INITIAL_WINS: ConfidenceWin[] = [
  {
    id: 'seed-1',
    timestamp: Date.now() - 86400000 * 2,
    title: 'Opened your Tada companion',
    category: 'unstick',
  },
  {
    id: 'seed-2',
    timestamp: Date.now() - 86400000,
    title: 'Kept your banking PIN safe',
    category: 'safety_check',
  },
  {
    id: 'seed-3',
    timestamp: Date.now() - 3600000 * 4,
    title: 'Explored with confidence',
    category: 'practice',
  },
];

export function getConfidenceWins(): ConfidenceWin[] {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) {
      localStorage.setItem(LEDGER_KEY, JSON.stringify(DEFAULT_INITIAL_WINS));
      return DEFAULT_INITIAL_WINS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_INITIAL_WINS;
  }
}

export function logConfidenceWin(title: string, category: ConfidenceWin['category'] = 'unstick'): ConfidenceWin {
  const currentWins = getConfidenceWins();
  const newWin: ConfidenceWin = {
    id: `win-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    title,
    category,
  };

  const updated = [newWin, ...currentWins];
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(updated));
  } catch (e) {}

  // The Product's Soul: Play chime, trigger confetti, and speak "Tada! You did it yourself."
  audioService.playTadaChime();
  audioService.triggerConfetti();
  audioService.speak('Tada! You did it yourself.');

  return newWin;
}

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated = { ...current, ...profile };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function updatePracticeWallet(delta: number): number {
  const profile = getUserProfile();
  const newBalance = Math.max(0, (profile.walletBalance || 10000) + delta);
  saveUserProfile({ walletBalance: newBalance });
  return newBalance;
}

export function resetPracticeWallet(): number {
  saveUserProfile({ walletBalance: 10000 });
  return 10000;
}
