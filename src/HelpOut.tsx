import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Home,
  Pill,
  Hospital,
  Share2,
  PhoneCall,
  Navigation,
  Train,
  CheckCircle,
  Volume2,
  Settings,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getUserProfile, saveUserProfile, logConfidenceWin } from '../utils/storage';
import { audioService } from '../utils/audioService';
import { ConfirmModal } from './ConfirmModal';

interface HelpOutProps {
  onBack: () => void;
}

export const HelpOut: React.FC<HelpOutProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Finding your location...');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [tempAddress, setTempAddress] = useState(profile.homeAddress || '');
  const [tempPhone, setTempPhone] = useState(profile.familyPhone || '');
  const [tempName, setTempName] = useState(profile.familyName || 'Beta / Beti');
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [hasLoggedWin, setHasLoggedWin] = useState(false);

  useEffect(() => {
    audioService.speak(
      "You are on the outdoor helper screen. I can guide you home, find nearby chemists, or send your location to family."
    );

    // Fetch GPS Geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLocationStatus('GPS location acquired accurately.');
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setLocationStatus('Location access optional. Using standard navigation.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleTakeMeHome = () => {
    if (!profile.homeAddress) {
      setShowAddressModal(true);
      audioService.speak('Please enter your home address once so Tada can always guide you home.');
      return;
    }

    const destination = encodeURIComponent(profile.homeAddress);
    const mapsUrl = location
      ? `https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${destination}&travelmode=walking`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    if (!hasLoggedWin) {
      logConfidenceWin('Navigated home with confidence', 'navigation');
      setHasLoggedWin(true);
    }

    window.open(mapsUrl, '_blank');
  };

  const handleFindChemist = () => {
    audioService.speak('Searching for nearest chemist pharmacy shops around you.');
    const query = encodeURIComponent('pharmacy chemist near me');
    const url = location
      ? `https://www.google.com/maps/search/?api=1&query=${query}&center=${location.lat},${location.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  const handleFindHospital = () => {
    audioService.speak('Searching for nearest hospitals around you.');
    const query = encodeURIComponent('hospital emergency near me');
    const url = location
      ? `https://www.google.com/maps/search/?api=1&query=${query}&center=${location.lat},${location.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsAppLocation = () => {
    const locText = location
      ? `https://maps.google.com/?q=${location.lat},${location.lng}`
      : 'current location';

    const msg = encodeURIComponent(
      `Namaste! I am out right now and sharing my live location with you: ${locText}. Tada companion is standing next to me.`
    );

    const cleanPhone = profile.familyPhone.replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;

    audioService.speak('Opening WhatsApp to send your location to family.');
    window.open(waUrl, '_blank');
  };

  const handleSaveAddress = () => {
    if (!tempAddress.trim()) return;
    const updated = saveUserProfile({ homeAddress: tempAddress.trim() });
    setProfile(updated);
    setShowAddressModal(false);
    audioService.speak('Your home address is saved safely on your device.');
  };

  const handleSaveFamily = () => {
    const updated = saveUserProfile({
      familyPhone: tempPhone.trim(),
      familyName: tempName.trim(),
    });
    setProfile(updated);
    setShowFamilyModal(false);
    audioService.speak('Family WhatsApp contact saved.');
  };

  const handleDialSOS = () => {
    setShowSOSConfirm(false);
    window.location.href = 'tel:112';
  };

  const readSeniorTravelRules = () => {
    audioService.speak(
      "Important Senior Citizen Travel rules in India: One. In Indian Railways, male passengers aged 60 and female passengers aged 58 qualify for automatic lower berth quota if traveling alone. Two. Free wheelchair assistance is available at all major railway stations and airport entry gates. Ask the assistance counter. Three. Domestic airlines like Air India and IndiGo offer up to 50% discount on basic fare for citizens aged 60 and above when booked with senior concession."
    );
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
          id="btn-sos-emergency"
          onClick={() => setShowSOSConfirm(true)}
          className="min-h-[64px] px-5 py-3 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xl flex items-center gap-2 shadow-md animate-pulse active:scale-95"
        >
          <AlertOctagon className="w-7 h-7 text-white" />
          <span>Emergency SOS 112</span>
        </button>
      </div>

      {/* Screen Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
          I'm out & need help
        </h1>
        <p className="text-xl text-stone-700 mt-1 font-medium">
          Directions to your doorstep, nearby chemist & hospital, and 1-tap family message.
        </p>
      </div>

      {/* Plain Words Confirm Modal for Emergency SOS */}
      <ConfirmModal
        isOpen={showSOSConfirm}
        title="Call Emergency Services (112)?"
        message="This will connect you immediately to the police, ambulance, or fire emergency team on 112."
        confirmLabel="Yes, Call 112 Now"
        cancelLabel="← Cancel, I am okay"
        onConfirm={handleDialSOS}
        onCancel={() => setShowSOSConfirm(false)}
      />

      {/* 1. GIANT PRIMARY ACTION: TAKE ME HOME */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 shadow-xl border-4 border-amber-600 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="px-4 py-1.5 rounded-full bg-stone-950 text-white font-extrabold text-sm uppercase tracking-wider">
            Primary Helper
          </span>
          <button
            id="btn-edit-home-address"
            onClick={() => setShowAddressModal(true)}
            className="text-stone-950 font-bold text-base flex items-center gap-1.5 underline decoration-2"
          >
            <Settings className="w-5 h-5" />
            <span>{profile.homeAddress ? 'Change Address' : 'Set Address'}</span>
          </button>
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-black font-display text-stone-950">
            Take Me Home
          </h2>
          <p className="text-xl font-bold text-stone-900 mt-1">
            {profile.homeAddress
              ? `Destination: ${profile.homeAddress}`
              : 'Tap to save your home address once, then 1 tap will guide you home anytime!'}
          </p>
        </div>

        <button
          id="btn-trigger-take-me-home"
          onClick={handleTakeMeHome}
          className="w-full min-h-[76px] rounded-2xl bg-stone-950 hover:bg-stone-900 text-amber-400 font-black text-2xl sm:text-3xl p-4 shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.99] border-2 border-stone-800"
        >
          <Navigation className="w-8 h-8 text-amber-400" />
          <span>Start Walking / Auto Directions Home</span>
        </button>
      </div>

      {/* 2. NEARBY CHEMIST & HOSPITAL (64px touch targets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Chemist */}
        <button
          id="btn-nearby-chemist"
          onClick={handleFindChemist}
          className="min-h-[96px] p-5 rounded-3xl bg-[#FFFDF7] hover:bg-amber-50/80 border-3 border-stone-300 hover:border-amber-400 text-left shadow-md flex items-center gap-4 transition-all active:scale-[0.98]"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Pill className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-stone-900 font-display">
              Nearest Chemist
            </h3>
            <p className="text-base text-stone-600 mt-0.5">Find pharmacy stores nearby</p>
          </div>
        </button>

        {/* Hospital */}
        <button
          id="btn-nearby-hospital"
          onClick={handleFindHospital}
          className="min-h-[96px] p-5 rounded-3xl bg-[#FFFDF7] hover:bg-amber-50/80 border-3 border-stone-300 hover:border-amber-400 text-left shadow-md flex items-center gap-4 transition-all active:scale-[0.98]"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <Hospital className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-stone-900 font-display">
              Nearest Hospital
            </h3>
            <p className="text-base text-stone-600 mt-0.5">Emergency & clinics</p>
          </div>
        </button>
      </div>

      {/* 3. ONE-TOUCH WHATSAPP TO FAMILY WITH LIVE LOCATION */}
      <div className="p-6 rounded-3xl bg-[#FFFDF7] border-3 border-stone-300 shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Share2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-stone-900 font-display">
                Family WhatsApp Message
              </h3>
              <p className="text-base text-stone-600 font-medium">
                To: {profile.familyName} {profile.familyPhone ? `(${profile.familyPhone})` : ''}
              </p>
            </div>
          </div>

          <button
            id="btn-edit-family"
            onClick={() => setShowFamilyModal(true)}
            className="text-stone-700 font-bold text-base underline"
          >
            {profile.familyPhone ? 'Change' : 'Set Phone'}
          </button>
        </div>

        <button
          id="btn-send-whatsapp-location"
          onClick={handleShareWhatsAppLocation}
          className="w-full min-h-[68px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl p-4 shadow-md flex items-center justify-center gap-3 transition-transform active:scale-[0.99] border-2 border-emerald-700"
        >
          <Share2 className="w-7 h-7 text-white" />
          <span>Send My Location on WhatsApp</span>
        </button>
      </div>

      {/* 4. SENIOR CITIZEN RAILWAY & AIRPORT CONCESSIONS */}
      <div className="p-6 rounded-3xl bg-amber-50/80 border-3 border-amber-300 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Train className="w-8 h-8 text-amber-800" />
            <h3 className="text-2xl font-extrabold text-stone-950 font-display">
              Senior Travel Rules & Assistance
            </h3>
          </div>
          <button
            id="btn-read-travel-rules"
            onClick={readSeniorTravelRules}
            className="min-h-[48px] px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-base flex items-center gap-2"
          >
            <Volume2 className="w-5 h-5 text-amber-900" />
            <span>Read Aloud</span>
          </button>
        </div>

        <div className="space-y-2.5 text-lg text-stone-800">
          <p className="p-3 bg-white rounded-xl border border-amber-200">
            🚆 <strong>Lower Berth Rail Quota:</strong> Automatically allocated in Indian Railways for men aged 60+ and women aged 58+ traveling alone or in pairs.
          </p>
          <p className="p-3 bg-white rounded-xl border border-amber-200">
            ♿ <strong>Free Wheelchair Assistance:</strong> Available at all major Indian railway stations & airport boarding gates. Approach the Sahayata / Helpdesk counter.
          </p>
          <p className="p-3 bg-white rounded-xl border border-amber-200">
            ✈️ <strong>Airline Discount:</strong> Air India & IndiGo offer senior citizens aged 60+ up to 50% discount on basic domestic airfares with valid Aadhaar card.
          </p>
        </div>
      </div>

      {/* MODAL: SET HOME ADDRESS */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFDF7] p-6 text-stone-900 shadow-2xl border-3 border-amber-400 flex flex-col gap-4">
            <h3 className="text-2xl font-bold font-display text-stone-900">
              Save Your Home Address
            </h3>
            <p className="text-lg text-stone-700">
              Enter your building, street, or landmark so Tada can always provide 1-tap walking or driving directions.
            </p>
            <textarea
              value={tempAddress}
              onChange={(e) => setTempAddress(e.target.value)}
              placeholder="e.g. Flat 302, Shanti Niketan Apartments, 12th Main Indiranagar, Bengaluru"
              rows={3}
              className="w-full p-4 text-xl rounded-2xl border-2 border-stone-300 bg-white"
            />
            <button
              onClick={handleSaveAddress}
              className="min-h-[64px] rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-2xl p-4 shadow-md"
            >
              Save Address
            </button>
            <button
              onClick={() => setShowAddressModal(false)}
              className="min-h-[56px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL: SET FAMILY CONTACT */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFDF7] p-6 text-stone-900 shadow-2xl border-3 border-amber-400 flex flex-col gap-4">
            <h3 className="text-2xl font-bold font-display text-stone-900">
              Save Family WhatsApp Contact
            </h3>
            <div>
              <label className="block text-base font-bold text-stone-700 mb-1">
                Name (e.g. Son, Daughter, Rahul):
              </label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full min-h-[56px] p-3 text-xl rounded-2xl border-2 border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-stone-700 mb-1">
                WhatsApp Number (with 91):
              </label>
              <input
                type="tel"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full min-h-[56px] p-3 text-xl rounded-2xl border-2 border-stone-300 bg-white"
              />
            </div>
            <button
              onClick={handleSaveFamily}
              className="min-h-[64px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl p-4 shadow-md"
            >
              Save Family Contact
            </button>
            <button
              onClick={() => setShowFamilyModal(false)}
              className="min-h-[56px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
