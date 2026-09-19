import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Bot,
  User,
  Loader2,
  ShieldAlert,
  Smartphone,
  MapPin,
  Music,
  Wallet,
} from 'lucide-react';
import { ScreenType } from '../types';
import { audioService } from '../utils/audioService';
import { logConfidenceWin } from '../utils/storage';

interface VoiceAgentProps {
  onBack: () => void;
  onNavigate: (screen: ScreenType, statePayload?: any) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolTriggered?: string;
}

const SAMPLE_QUESTIONS = [
  'Someone is asking me for an OTP on WhatsApp',
  'I do not know what to press on this screen',
  'Can I practice sending UPI money?',
  'Find a chemist near me',
  'Play some peaceful Mohd Rafi songs',
  'How to book lower berth in train for senior citizen?',
];

export const VoiceAgent: React.FC<VoiceAgentProps> = ({ onBack, onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Namaste! I am your companion Tada. You can speak to me naturally, and I can take you to any screen or answer any question. What would you like to do?',
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    audioService.speak(
      'Namaste! I am your companion Tada. Speak to me by tapping the big microphone button, or tap any suggestion below.'
    );

    return () => {
      stopListening();
      audioService.stopSpeaking();
    };
  }, []);

  const startListening = () => {
    // BARGE-IN: stop any ongoing audio playback immediately
    audioService.stopSpeaking();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not available in this browser. Please tap the suggested questions.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
        if (event.results[0].isFinal) {
          handleSendMessage(currentText);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech error:', e);
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

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Process user request & AGENTIC TOOL EXECUTION
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;
    stopListening();

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/voice-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userText,
          history: newMessages.slice(-6),
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "I am right here with you, Ji.";
      const toolCalls = data.toolCalls || [];

      let executedToolName: string | undefined;

      // AGENTIC FUNCTION CALLING: Execute tools declared by model
      if (toolCalls.length > 0) {
        const primaryTool = toolCalls[0];
        executedToolName = primaryTool.name;

        // Speak reply and execute navigation
        audioService.speak(replyText, () => {
          executeAgentTool(primaryTool.name, primaryTool.args);
        });

        // Also schedule navigation after short timeout in case speech is skipped
        setTimeout(() => {
          executeAgentTool(primaryTool.name, primaryTool.args);
        }, 2200);
      } else {
        // Just speak the reply
        audioService.speak(replyText);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyText,
          toolTriggered: executedToolName,
        },
      ]);
    } catch (err) {
      console.warn('Voice agent error:', err);
      // Fallback intent detection
      fallbackRouteUser(userText);
    } finally {
      setIsLoading(false);
      setTranscript('');
    }
  };

  const executeAgentTool = (toolName: string, args: any = {}) => {
    switch (toolName) {
      case 'openScreenCoach':
        onNavigate('SCREEN_COACH');
        break;
      case 'checkScam':
        onNavigate('SAFETY_CHECKER', { initialText: args.text || '' });
        break;
      case 'startPractice':
        onNavigate('PRACTICE_ROOM');
        break;
      case 'findNearby':
      case 'planTravel':
      case 'messageFamily':
        onNavigate('HELP_OUT');
        break;
      case 'playEra':
        onNavigate('MUSIC_MEMORIES');
        break;
      case 'logWin':
        logConfidenceWin(args.reason || 'Did it with voice agent', 'voice');
        break;
      default:
        break;
    }
  };

  const fallbackRouteUser = (text: string) => {
    const lower = text.toLowerCase();
    let reply = "I am right here with you.";
    if (lower.includes('otp') || lower.includes('scam') || lower.includes('safe') || lower.includes('fraud')) {
      reply = "Someone is asking for an OTP? That is dangerous. Let us check the safety checker immediately.";
      audioService.speak(reply);
      setTimeout(() => onNavigate('SAFETY_CHECKER', { initialText: text }), 2000);
    } else if (lower.includes('screen') || lower.includes('stuck') || lower.includes('button')) {
      reply = "Let me look at your screen with you. Opening the Screen Coach.";
      audioService.speak(reply);
      setTimeout(() => onNavigate('SCREEN_COACH'), 1800);
    } else if (lower.includes('practice') || lower.includes('rehearse') || lower.includes('upi')) {
      reply = "Opening the Practice Room where nothing real can go wrong.";
      audioService.speak(reply);
      setTimeout(() => onNavigate('PRACTICE_ROOM'), 1800);
    } else if (lower.includes('music') || lower.includes('song') || lower.includes('rafi') || lower.includes('bhajan')) {
      reply = "Opening your music player for you.";
      audioService.speak(reply);
      setTimeout(() => onNavigate('MUSIC_MEMORIES'), 1800);
    } else {
      audioService.speak("I am right here with you. Tap any screen or ask me to open anything.");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-6">
      {/* Giant ← Back Button (Design Law) */}
      <div className="flex items-center justify-between gap-4">
        <button
          id="btn-back-home"
          onClick={() => {
            stopListening();
            audioService.stopSpeaking();
            onBack();
          }}
          className="min-h-[64px] px-6 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-stone-900 border-2 border-amber-300 font-bold text-xl flex items-center gap-3 transition-all active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-7 h-7 text-amber-900" />
          <span>← Back to Home</span>
        </button>

        <button
          id="btn-stop-audio-bargein"
          onClick={() => audioService.stopSpeaking()}
          className="min-h-[64px] px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 border-2 border-stone-300 font-bold text-lg flex items-center gap-2"
        >
          <Volume2 className="w-6 h-6 text-stone-700" />
          <span>Stop Speaking</span>
        </button>
      </div>

      {/* Screen Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
          Ask me anything
        </h1>
        <p className="text-xl text-stone-700 mt-1 font-medium">
          Speak in your natural voice. I can control the app, open screens, and answer questions.
        </p>
      </div>

      {/* Giant Voice Microphone Button (Touch Target ≥ 96px, Pulsing when listening) */}
      <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-50 to-white border-3 border-amber-400 shadow-md flex flex-col items-center justify-center gap-4 text-center">
        <button
          id="btn-voice-mic"
          onClick={handleToggleMic}
          aria-label={isListening ? 'Stop listening' : 'Start speaking with Tada'}
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 border-4 ${
            isListening
              ? 'bg-rose-600 border-rose-800 text-white animate-pulse ring-8 ring-rose-200'
              : 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-stone-950 ring-8 ring-amber-100'
          }`}
        >
          {isListening ? (
            <MicOff className="w-14 h-14" />
          ) : (
            <Mic className="w-14 h-14" />
          )}
        </button>

        <div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-display">
            {isListening ? 'Listening to you... Speak now' : 'Tap to Speak'}
          </p>
          <p className="text-lg text-stone-600 mt-1">
            {isListening
              ? transcript || 'Listening for your voice...'
              : 'Tap once to ask anything or tell me which screen to open'}
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 text-amber-800 font-bold text-xl mt-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Thinking & preparing action...</span>
          </div>
        )}
      </div>

      {/* Chat Transcript / Dialogue Display */}
      <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1">
        {messages.slice(-4).map((msg, i) => (
          <div
            key={i}
            className={`p-5 rounded-3xl text-xl leading-relaxed shadow-xs flex items-start gap-4 ${
              msg.role === 'user'
                ? 'bg-amber-100/90 text-stone-950 border-2 border-amber-300 ml-6'
                : 'bg-[#FFFDF7] text-stone-900 border-2 border-stone-300 mr-6'
            }`}
          >
            <div
              className={`p-2.5 rounded-2xl shrink-0 ${
                msg.role === 'user' ? 'bg-amber-300 text-amber-950' : 'bg-amber-500 text-stone-950'
              }`}
            >
              {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
            </div>

            <div className="flex-1">
              <p className="font-semibold">{msg.content}</p>
              {msg.toolTriggered && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-200/80 text-amber-950 text-sm font-extrabold">
                  <Sparkles className="w-4 h-4 text-amber-800" />
                  <span>Navigating app to requested helper...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Suggested 1-Tap Questions for Quick Testing */}
      <div className="p-5 rounded-3xl bg-amber-50/70 border-2 border-amber-200">
        <p className="text-sm font-bold uppercase tracking-wider text-amber-900 mb-3">
          Or tap to ask any common question:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              id={`btn-sample-question-${idx}`}
              onClick={() => handleSendMessage(q)}
              className="p-3.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-left text-base sm:text-lg font-bold text-stone-900 transition-colors"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
