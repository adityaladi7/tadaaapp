import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wallet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Send,
  Lock,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Volume2,
} from 'lucide-react';
import { PracticeScenario } from '../types';
import { getUserProfile, updatePracticeWallet, resetPracticeWallet, logConfidenceWin } from '../utils/storage';
import { audioService } from '../utils/audioService';
import { ConfirmModal } from './ConfirmModal';

interface PracticeRoomProps {
  onBack: () => void;
}

const PRESET_CONTACTS = [
  { name: 'Raju Doodhwala (Milkman)', upi: 'raju.milk@upi', defaultAmt: 180 },
  { name: 'Apollo Chemist', upi: 'apollopharmacy@icici', defaultAmt: 420 },
  { name: 'Aarav (Grandson Birthday)', upi: 'aarav.grandson@oksbi', defaultAmt: 500 },
  { name: 'Local Vegetable Vendor (Sabzi)', upi: 'ramesh.sabzi@paytm', defaultAmt: 120 },
];

export const PracticeRoom: React.FC<PracticeRoomProps> = ({ onBack }) => {
  const [profile, setProfile] = useState(() => getUserProfile());
  const [activeTab, setActiveTab] = useState<'PAYMENT_REHEARSAL' | 'SPOT_FRAUD'>('PAYMENT_REHEARSAL');

  // Rehearsal Flow States: 'SELECT_PAYEE' -> 'ENTER_PIN' -> 'SUCCESS'
  const [flowStep, setFlowStep] = useState<'SELECT_PAYEE' | 'ENTER_PIN' | 'SUCCESS'>('SELECT_PAYEE');
  const [recipient, setRecipient] = useState(PRESET_CONTACTS[0]);
  const [customPayee, setCustomPayee] = useState('');
  const [amount, setAmount] = useState<number>(180);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Spot the Fraud Game State
  const [scenario, setScenario] = useState<PracticeScenario | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isScenarioLoading, setIsScenarioLoading] = useState(false);

  // Reset Wallet Confirmation Modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    audioService.speak(
      "Welcome to the Practice Room. Nothing real can go wrong here. No real money will ever leave your bank. This is just for practice."
    );
  }, []);

  // Fetch or cycle a fraud scenario
  const loadScenario = async () => {
    setIsScenarioLoading(true);
    setSelectedOptionId(null);
    try {
      const res = await fetch('/api/gemini/practice-fraud-game');
      const data = await res.json();
      setScenario(data);
      audioService.speak(`Practice Challenge: ${data.title}. ${data.question}`);
    } catch (e) {
      // safe fallback
      const fallback: PracticeScenario = {
        id: 'otp-rehearse',
        title: 'Stranger Calls Asking For 6-Digit Code',
        sender: 'Caller claiming to be from Post Office',
        message: 'Sir, your parcel is waiting. We just sent an OTP on SMS. Tell me the numbers so I can deliver your speed post.',
        question: 'What should you do?',
        options: [
          {
            id: 'safe',
            text: 'Never tell them the OTP. Ask them to deliver the parcel to your doorstep address directly.',
            isCorrect: true,
            feedback: 'Spot on! Postmen never need an SMS OTP to deliver physical speed posts.',
          },
          {
            id: 'danger',
            text: 'Quickly read out the 6 digits from your SMS so the parcel arrives.',
            isCorrect: false,
            feedback: 'Watch out! The SMS code is probably a bank or account login OTP.',
          },
        ],
        lesson: 'Never share any OTP over a phone call, no matter what reason the caller gives.',
      };
      setScenario(fallback);
      audioService.speak(`Practice Challenge: ${fallback.title}. ${fallback.question}`);
    } finally {
      setIsScenarioLoading(false);
    }
  };

  const handleProceedToPin = () => {
    if (amount <= 0 || isNaN(amount)) {
      audioService.speak('Please enter a valid amount to practice.');
      return;
    }
    if (amount > profile.walletBalance) {
      audioService.speak('Your practice wallet has lower balance. You can reset your 10,000 practice rupees anytime.');
      return;
    }
    setEnteredPin('');
    setPinError(null);
    setFlowStep('ENTER_PIN');
    audioService.speak(
      `Practicing payment of ₹${amount} to ${customPayee || recipient.name}. Enter any 4 or 6 numbers on the practice keypad.`
    );
  };

  const handleKeypadPress = (num: string) => {
    if (enteredPin.length < 6) {
      setEnteredPin((prev) => prev + num);
      setPinError(null);
    }
  };

  const handleKeypadBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleCompletePayment = () => {
    if (enteredPin.length < 4) {
      setPinError('Please enter at least 4 digits for your practice PIN.');
      audioService.speak('Please enter at least 4 numbers on the practice keypad.');
      return;
    }

    // Deduct from practice wallet
    const newBal = updatePracticeWallet(-amount);
    setProfile({ ...profile, walletBalance: newBal });
    setFlowStep('SUCCESS');

    // Soul of the product: Celebrate and log win
    logConfidenceWin(`Completed UPI payment rehearsal of ₹${amount}`, 'practice');
  };

  const handleResetConfirm = () => {
    const newBal = resetPracticeWallet();
    setProfile({ ...profile, walletBalance: newBal });
    setShowResetConfirm(false);
    audioService.speak('Your practice wallet has been refilled with 10,000 practice rupees.');
  };

  const handleAnswerOption = (option: PracticeScenario['options'][0]) => {
    setSelectedOptionId(option.id);
    if (option.isCorrect) {
      audioService.speak(`Correct! ${option.feedback}`);
      logConfidenceWin('Spotted a fraud scenario in practice room', 'practice');
    } else {
      audioService.speak(`Good attempt to learn. ${option.feedback}`);
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

        <button
          id="btn-repeat-audio"
          onClick={() =>
            audioService.speak(
              "Nothing real can go wrong here. This is your safe practice room with fake 10,000 rupees."
            )
          }
          className="min-h-[64px] px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 border-2 border-stone-300 font-bold text-lg flex items-center gap-2"
        >
          <Volume2 className="w-6 h-6 text-amber-700" />
          <span className="hidden sm:inline">Explain</span>
        </button>
      </div>

      {/* Screen Title & EXPLICIT SAFE PROMISE */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
          Practice Room
        </h1>
        {/* NON-NEGOTIABLE EXPLICIT STATEMENT ON SCREEN */}
        <div
          id="banner-safe-rehearsal"
          className="mt-2 p-4 sm:p-5 rounded-2xl bg-sky-100 border-3 border-sky-400 text-sky-950 font-bold text-lg sm:text-xl flex items-center gap-3 shadow-xs"
        >
          <CheckCircle2 className="w-8 h-8 text-sky-700 shrink-0" />
          <span>
            Nothing real can go wrong here. No real money will ever leave your bank. This is just for practice.
          </span>
        </div>
      </div>

      {/* FAKE WALLET BAR */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFDF7] border-3 border-amber-300 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-wider font-extrabold text-amber-800">
              Practice Wallet Balance
            </p>
            <p className="text-3xl sm:text-4xl font-black text-stone-900 font-display">
              ₹{profile.walletBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <button
          id="btn-refill-wallet"
          onClick={() => setShowResetConfirm(true)}
          className="min-h-[56px] px-4 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 border-2 border-stone-300 text-stone-800 font-bold text-base flex items-center gap-2 transition-colors active:scale-95"
        >
          <RotateCcw className="w-5 h-5 text-stone-600" />
          <span>Refill ₹10,000</span>
        </button>
      </div>

      {/* Plain Words Confirm Modal for Wallet Reset */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Refill Practice Wallet?"
        message="This will reset your fake rehearsal balance back to ₹10,000. No real money is involved at all."
        confirmLabel="Yes, Refill to ₹10,000"
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Two Clear Modes: UPI Rehearsal vs Spot-The-Fraud Game */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-stone-200/70 rounded-2xl">
        <button
          id="tab-upi-rehearsal"
          onClick={() => {
            setActiveTab('PAYMENT_REHEARSAL');
            audioService.speak('Switched to Rehearse UPI Payment mode.');
          }}
          className={`min-h-[58px] rounded-xl font-bold text-lg sm:text-xl transition-all ${
            activeTab === 'PAYMENT_REHEARSAL'
              ? 'bg-white text-stone-900 shadow-sm border-2 border-amber-400'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          Rehearse a Payment
        </button>
        <button
          id="tab-spot-fraud"
          onClick={() => {
            setActiveTab('SPOT_FRAUD');
            if (!scenario) loadScenario();
            audioService.speak('Switched to Spot The Fraud game mode.');
          }}
          className={`min-h-[58px] rounded-xl font-bold text-lg sm:text-xl transition-all ${
            activeTab === 'SPOT_FRAUD'
              ? 'bg-white text-stone-900 shadow-sm border-2 border-amber-400'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          Spot The Fraud Game
        </button>
      </div>

      {/* TAB 1: REHEARSE A UPI PAYMENT */}
      {activeTab === 'PAYMENT_REHEARSAL' && (
        <div className="flex flex-col gap-6">
          {/* STEP 1: SELECT PAYEE & AMOUNT */}
          {flowStep === 'SELECT_PAYEE' && (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl font-bold text-stone-900">
                1. Choose who to send practice money to:
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_CONTACTS.map((c, i) => (
                  <button
                    key={i}
                    id={`btn-preset-payee-${i}`}
                    onClick={() => {
                      setRecipient(c);
                      setCustomPayee('');
                      setAmount(c.defaultAmt);
                    }}
                    className={`min-h-[72px] p-4 rounded-2xl border-3 text-left transition-all ${
                      recipient.name === c.name && !customPayee
                        ? 'bg-amber-100/90 border-amber-500 shadow-xs'
                        : 'bg-[#FFFDF7] border-stone-300 hover:border-amber-300'
                    }`}
                  >
                    <p className="font-extrabold text-xl text-stone-900">{c.name}</p>
                    <p className="text-sm font-semibold text-stone-600">{c.upi}</p>
                  </button>
                ))}
              </div>

              {/* Or enter custom name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="txt-custom-payee" className="text-lg font-bold text-stone-800">
                  Or type any name (optional):
                </label>
                <input
                  id="txt-custom-payee"
                  type="text"
                  placeholder="e.g. Electrician, Sharma Ji, Fruit stall"
                  value={customPayee}
                  onChange={(e) => setCustomPayee(e.target.value)}
                  className="w-full min-h-[64px] p-4 text-xl rounded-2xl border-2 border-stone-300 bg-white text-stone-900"
                />
              </div>

              {/* Amount input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="txt-rehearse-amount" className="text-lg font-bold text-stone-800">
                  Practice Amount (₹):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-stone-600">
                    ₹
                  </span>
                  <input
                    id="txt-rehearse-amount"
                    type="number"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full min-h-[64px] pl-10 pr-4 text-3xl font-extrabold rounded-2xl border-2 border-stone-300 bg-white text-stone-900"
                  />
                </div>
              </div>

              {/* ONE Primary Action to Proceed */}
              <button
                id="btn-proceed-to-pin"
                onClick={handleProceedToPin}
                className="w-full min-h-[76px] rounded-3xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-extrabold text-2xl sm:text-3xl p-4 shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.99] border-3 border-amber-600 mt-2"
              >
                <span>Rehearse Payment of ₹{amount}</span>
                <ChevronRight className="w-8 h-8 text-stone-950" />
              </button>
            </div>
          )}

          {/* STEP 2: SIMULATED SECURE PIN KEYPAD SCREEN */}
          {flowStep === 'ENTER_PIN' && (
            <div className="flex flex-col gap-6 items-center">
              <div className="w-full p-6 rounded-3xl bg-amber-50/70 border-3 border-amber-300 text-center flex flex-col items-center gap-2">
                <div className="p-3 bg-amber-200 rounded-full">
                  <Lock className="w-8 h-8 text-amber-900" />
                </div>
                <p className="text-lg font-bold text-stone-700">Paying practice amount</p>
                <p className="text-4xl font-black text-stone-950">₹{amount}</p>
                <p className="text-xl font-bold text-amber-900">
                  to {customPayee || recipient.name}
                </p>
              </div>

              {/* PIN display dots */}
              <div className="flex flex-col items-center gap-2 my-2">
                <p className="text-xl font-bold text-stone-900">
                  Enter any 4 or 6 numbers (Practice Keypad):
                </p>
                <div className="flex gap-3">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        idx < enteredPin.length
                          ? 'bg-stone-900 border-stone-900 scale-110'
                          : 'bg-stone-200 border-stone-400'
                      }`}
                    />
                  ))}
                </div>
                {pinError && <p className="text-rose-600 font-bold text-lg mt-1">{pinError}</p>}
              </div>

              {/* Large Accessible Numeric Keypad */}
              <div className="w-full max-w-sm grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                  <button
                    key={n}
                    id={`btn-keypad-${n}`}
                    onClick={() => handleKeypadPress(n)}
                    className="min-h-[68px] rounded-2xl bg-white hover:bg-stone-100 active:bg-stone-200 text-3xl font-extrabold text-stone-900 border-2 border-stone-300 shadow-xs flex items-center justify-center transition-transform active:scale-95"
                  >
                    {n}
                  </button>
                ))}
                <button
                  id="btn-keypad-clear"
                  onClick={() => setEnteredPin('')}
                  className="min-h-[68px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-lg font-bold text-stone-700 border-2 border-stone-300 flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  id="btn-keypad-0"
                  onClick={() => handleKeypadPress('0')}
                  className="min-h-[68px] rounded-2xl bg-white hover:bg-stone-100 text-3xl font-extrabold text-stone-900 border-2 border-stone-300 shadow-xs flex items-center justify-center active:scale-95"
                >
                  0
                </button>
                <button
                  id="btn-keypad-backspace"
                  onClick={handleKeypadBackspace}
                  className="min-h-[68px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-xl font-bold text-stone-700 border-2 border-stone-300 flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              {/* ONE Primary Action: Confirm Practice Payment */}
              <button
                id="btn-complete-practice-payment"
                onClick={handleCompletePayment}
                className="w-full min-h-[76px] rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-2xl sm:text-3xl p-4 shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.99] border-3 border-emerald-700"
              >
                <Send className="w-8 h-8" />
                <span>Confirm Practice Payment</span>
              </button>

              <button
                id="btn-cancel-pin-step"
                onClick={() => setFlowStep('SELECT_PAYEE')}
                className="text-lg font-bold text-stone-600 underline p-2"
              >
                ← Go back and change amount
              </button>
            </div>
          )}

          {/* STEP 3: SUCCESS CELEBRATION */}
          {flowStep === 'SUCCESS' && (
            <div className="p-8 rounded-3xl bg-emerald-50 border-4 border-emerald-400 text-center flex flex-col items-center gap-5 shadow-lg">
              <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-display">
                  Tada! Rehearsal Successful!
                </h2>
                <p className="text-2xl font-bold text-stone-800 mt-2">
                  ₹{amount} safely paid to {customPayee || recipient.name}
                </p>
                <p className="text-lg text-emerald-800 font-medium mt-1">
                  Your practice wallet balance is now ₹{profile.walletBalance.toLocaleString('en-IN')}.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border-2 border-emerald-300 text-stone-800 text-lg">
                💡 <strong>Remember in real life:</strong> Always verify the receiver's name on your screen before entering your PIN.
              </div>

              {/* ONE Primary Action */}
              <button
                id="btn-practice-again"
                onClick={() => setFlowStep('SELECT_PAYEE')}
                className="w-full min-h-[72px] rounded-3xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-2xl p-4 shadow-md transition-all active:scale-[0.99]"
              >
                Practice Another Payment
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SPOT THE FRAUD GAME */}
      {activeTab === 'SPOT_FRAUD' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-stone-900">
              Spot-The-Fraud Challenge:
            </h2>
            <button
              id="btn-new-scenario"
              onClick={loadScenario}
              disabled={isScenarioLoading}
              className="min-h-[50px] px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 font-bold text-base flex items-center gap-2"
            >
              {isScenarioLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-700" />}
              <span>Next Scenario</span>
            </button>
          </div>

          {isScenarioLoading && (
            <div className="p-12 text-center flex flex-col items-center gap-4 bg-[#FFFDF7] rounded-3xl border-2 border-amber-300">
              <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
              <p className="text-2xl font-bold text-stone-800">Generating a practice challenge...</p>
            </div>
          )}

          {scenario && !isScenarioLoading && (
            <div className="flex flex-col gap-5">
              {/* Scenario message card */}
              <div className="p-6 rounded-3xl bg-[#FFFDF7] border-3 border-amber-300 shadow-md flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-amber-700" />
                  <span className="text-sm uppercase font-extrabold tracking-wider text-amber-800">
                    From: {scenario.sender}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-stone-950 font-display">
                  "{scenario.title}"
                </h3>
                <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-200 text-xl text-stone-900 italic">
                  "{scenario.message}"
                </div>
                <p className="text-2xl font-extrabold text-stone-900 mt-2">
                  ❓ {scenario.question}
                </p>
              </div>

              {/* Two Options (Choice A and Choice B) */}
              <div className="flex flex-col gap-4">
                {scenario.options.map((opt, index) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <div key={opt.id} className="flex flex-col gap-2">
                      <button
                        id={`btn-option-${index}`}
                        onClick={() => handleAnswerOption(opt)}
                        className={`w-full min-h-[80px] p-5 rounded-3xl border-3 text-left font-extrabold text-xl sm:text-2xl transition-all shadow-md active:scale-[0.99] flex items-center gap-4 ${
                          isSelected
                            ? opt.isCorrect
                              ? 'bg-emerald-600 text-white border-emerald-800'
                              : 'bg-rose-700 text-white border-rose-900'
                            : 'bg-[#FFFDF7] text-stone-900 border-stone-300 hover:border-amber-400'
                        }`}
                      >
                        <span className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0 text-xl font-black">
                          {index === 0 ? 'A' : 'B'}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                      </button>

                      {/* Feedback Reveal */}
                      {isSelected && (
                        <div
                          className={`p-4 rounded-2xl border-2 text-xl font-bold flex items-start gap-3 ${
                            opt.isCorrect
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                              : 'bg-amber-100 text-stone-900 border-amber-300'
                          }`}
                        >
                          {opt.isCorrect ? (
                            <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-7 h-7 text-amber-800 shrink-0 mt-0.5" />
                          )}
                          <p>{opt.feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Lesson Box */}
              {selectedOptionId && (
                <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-stone-900">
                  <p className="text-sm font-bold uppercase tracking-wider text-amber-800 mb-1">
                    Rule of Thumb:
                  </p>
                  <p className="text-xl font-bold">{scenario.lesson}</p>
                </div>
              )}

              {/* Next Challenge Action */}
              <button
                id="btn-next-fraud-scenario"
                onClick={loadScenario}
                className="w-full min-h-[68px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xl border-2 border-stone-300 mt-2"
              >
                Try Another Scenario
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
