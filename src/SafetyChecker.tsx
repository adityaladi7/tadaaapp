import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  PhoneCall,
  Volume2,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle,
  ClipboardPaste,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { FraudCheckResult } from '../types';
import { audioService } from '../utils/audioService';
import { logConfidenceWin } from '../utils/storage';

interface SafetyCheckerProps {
  onBack: () => void;
  initialText?: string;
}

const COMMON_SCAMS = [
  {
    name: 'Electricity Cutoff Notice',
    text: 'Dear Consumer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill of ₹480. Contact Officer at 9876543210 immediately.',
  },
  {
    name: 'Bank Account Blocked / KYC',
    text: 'Dear Customer, Your SBI account is blocked today due to pending PAN card update. Download sbi-update.apk to unblock: http://bit.ly/sbi-pan',
  },
  {
    name: 'Lottery / KBC ₹25 Lakh Prize',
    text: 'Congratulations! You have won ₹25,00,000 in KBC Lucky Draw. To claim your lottery money, send ₹100 registration fee to UPI: kbcwinner@paytm',
  },
  {
    name: 'Genuine Bank OTP',
    text: '584920 is your OTP for purchase of ₹1,499 at Amazon India. Do NOT share this OTP with anyone, including bank staff.',
  },
];

export const SafetyChecker: React.FC<SafetyCheckerProps> = ({ onBack, initialText = '' }) => {
  const [inputText, setInputText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FraudCheckResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasLoggedWin, setHasLoggedWin] = useState(false);

  useEffect(() => {
    if (initialText) {
      checkMessage(initialText);
    } else {
      audioService.speak(
        'Payment Safety Checker is ready. Paste or dictate the message you received, and I will tell you if it is safe.'
      );
    }
  }, [initialText]);

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type or paste your message.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        audioService.speak('Listening. Please speak the message aloud now.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        checkMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        checkMessage(text);
      }
    } catch (e) {
      // Manual focus fallback
      const field = document.getElementById('txt-scam-input') as HTMLTextAreaElement;
      field?.focus();
    }
  };

  const checkMessage = async (textToCheck: string) => {
    if (!textToCheck.trim()) return;

    setIsLoading(true);
    setResult(null);
    audioService.speak('Checking this message for fraud right now. Please give me two seconds.');

    try {
      const res = await fetch('/api/gemini/check-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToCheck }),
      });

      const data: FraudCheckResult = await res.json();
      setResult(data);
      audioService.speak(data.spokenAdvice);
    } catch (e) {
      const fallback: FraudCheckResult = {
        verdict: 'BE CAREFUL',
        why: 'We cannot verify this message safely right now. Electricity boards and banks never demand immediate payment through personal links.',
        oneInstruction: 'Do not pay. Wait and consult your family or call 1930.',
        helpline: '1930',
        spokenAdvice:
          'Please be very cautious. Never share any secret OTP or click unknown payment links. When in doubt, call helpline 1930.',
      };
      setResult(fallback);
      audioService.speak(fallback.spokenAdvice);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkSuccess = () => {
    if (!hasLoggedWin) {
      logConfidenceWin('Checked payment safety before paying', 'safety_check');
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
            id="btn-repeat-fraud-advice"
            onClick={() => audioService.speak(result.spokenAdvice)}
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
          Is this safe to pay?
        </h1>
        <p className="text-xl text-stone-700 mt-1 font-medium">
          Paste or read any SMS, WhatsApp forward, or payment request. Tada will check for fraud.
        </p>
      </div>

      {/* Message Input Box */}
      <div className="flex flex-col gap-3">
        <label htmlFor="txt-scam-input" className="text-xl font-bold text-stone-900">
          Message or request text:
        </label>
        <textarea
          id="txt-scam-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste SMS here, e.g. 'Your electricity will be disconnected...' or 'Send ₹1 to claim lottery...'"
          rows={4}
          className="w-full p-4 text-xl rounded-2xl border-3 border-stone-300 focus:border-amber-500 focus:outline-hidden bg-white text-stone-900 shadow-inner"
        />

        {/* Action controls: Paste, Dictate, and Giant Primary Check Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="btn-paste-clipboard"
            onClick={handlePaste}
            className="min-h-[64px] p-4 rounded-2xl bg-stone-100 hover:bg-stone-200 border-2 border-stone-300 font-bold text-xl text-stone-900 flex items-center justify-center gap-3 active:scale-98"
          >
            <ClipboardPaste className="w-7 h-7 text-stone-700" />
            <span>Paste from Clipboard</span>
          </button>

          <button
            id="btn-dictate-speech"
            onClick={handleVoiceInput}
            className={`min-h-[64px] p-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 active:scale-98 border-2 ${
              isListening
                ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-7 h-7" />
                <span>Listening... Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-7 h-7 text-amber-900" />
                <span>Dictate with Voice</span>
              </>
            )}
          </button>
        </div>

        {/* ONE Primary Action Button (Design Law) */}
        <button
          id="btn-submit-check"
          onClick={() => checkMessage(inputText)}
          disabled={isLoading || !inputText.trim()}
          className="w-full min-h-[76px] rounded-3xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-2xl sm:text-3xl p-4 shadow-lg flex items-center justify-center gap-4 transition-transform active:scale-[0.99] border-3 border-emerald-700 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>Checking Safety...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-9 h-9" />
              <span>Check If Safe To Pay</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Common Scams for quick test */}
      {!result && !isLoading && (
        <div className="p-5 rounded-3xl bg-amber-50/70 border-2 border-amber-200 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-800" />
            <h2 className="font-bold text-xl text-stone-900">Try common scam messages in India:</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMON_SCAMS.map((scam, i) => (
              <button
                key={i}
                id={`btn-preset-scam-${i}`}
                onClick={() => {
                  setInputText(scam.text);
                  checkMessage(scam.text);
                }}
                className="p-4 rounded-xl bg-white hover:bg-amber-100/60 border-2 border-amber-300 text-left transition-colors"
              >
                <p className="font-bold text-lg text-stone-900">{scam.name}</p>
                <p className="text-sm text-stone-600 line-clamp-2 mt-1">{scam.text}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Structured Fraud Verdict Result */}
      {result && !isLoading && (
        <div className="flex flex-col gap-6">
          {/* VERDICT BADGE */}
          <div
            id="verdict-banner"
            className={`w-full p-6 sm:p-8 rounded-3xl border-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-5 ${
              result.verdict === 'LIKELY FRAUD'
                ? 'bg-rose-700 text-white border-rose-900'
                : result.verdict === 'BE CAREFUL'
                ? 'bg-amber-500 text-stone-950 border-amber-700'
                : 'bg-emerald-600 text-white border-emerald-800'
            }`}
          >
            <div className="p-4 bg-white/20 rounded-2xl shrink-0">
              {result.verdict === 'LIKELY FRAUD' ? (
                <XCircle className="w-12 h-12 text-white" />
              ) : result.verdict === 'BE CAREFUL' ? (
                <AlertTriangle className="w-12 h-12 text-stone-950" />
              ) : (
                <ShieldCheck className="w-12 h-12 text-white" />
              )}
            </div>

            <div>
              <span className="text-base uppercase tracking-wider font-extrabold opacity-90 block">
                Safety Verdict
              </span>
              <p className="text-3xl sm:text-4xl font-black font-display leading-none mt-1">
                {result.verdict}
              </p>
            </div>
          </div>

          {/* WHY (Plain words, zero tech jargon) */}
          <div className="p-6 rounded-3xl bg-[#FFFDF7] border-3 border-stone-300 shadow-md flex flex-col gap-2">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-stone-600">
              Why:
            </h2>
            <p className="text-xl sm:text-2xl text-stone-900 font-semibold leading-relaxed">
              {result.why}
            </p>
          </div>

          {/* ONE INSTRUCTION (Crystal-clear single command) */}
          <div className="p-6 rounded-3xl bg-amber-50 border-3 border-amber-400 shadow-md flex flex-col gap-2">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-amber-900">
              Your One Instruction:
            </h2>
            <p className="text-2xl sm:text-3xl text-stone-950 font-black leading-snug">
              👉 {result.oneInstruction}
            </p>
          </div>

          {/* NATIONAL HELPLINE 1930 */}
          <div className="p-6 rounded-3xl bg-stone-900 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-600 text-white rounded-2xl">
                <PhoneCall className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-stone-300">
                  National Cyber Crime Helpline
                </p>
                <p className="text-3xl font-black text-amber-400">Dial 1930</p>
              </div>
            </div>

            <a
              id="btn-call-1930"
              href="tel:1930"
              className="w-full sm:w-auto min-h-[64px] px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-md"
            >
              <PhoneCall className="w-7 h-7" />
              <span>Call 1930 Now</span>
            </a>
          </div>

          {/* Primary Action: Log Confidence Win */}
          <div className="flex flex-col gap-3">
            {!hasLoggedWin ? (
              <button
                id="btn-win-checked-fraud"
                onClick={handleMarkSuccess}
                className="w-full min-h-[80px] rounded-3xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-2xl sm:text-3xl p-5 shadow-lg flex items-center justify-center gap-4 transition-transform active:scale-[0.99] border-3 border-amber-600"
              >
                <CheckCircle className="w-9 h-9 text-stone-950" />
                <span>I Checked Before Paying 🎉</span>
              </button>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-100 text-emerald-950 border-2 border-emerald-400 text-center font-bold text-2xl flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-emerald-600" />
                <span>Tada! You did it yourself! Win added to your Ledger.</span>
              </div>
            )}

            <button
              id="btn-check-another-message"
              onClick={() => {
                setInputText('');
                setResult(null);
                setHasLoggedWin(false);
              }}
              className="w-full min-h-[64px] rounded-2xl bg-[#FFFDF7] hover:bg-stone-100 text-stone-900 font-bold text-xl border-2 border-stone-300"
            >
              Check another message
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
