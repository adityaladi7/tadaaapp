import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { audioService } from '../utils/audioService';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  speakOnOpen?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = '← No, Take Me Back',
  onConfirm,
  onCancel,
  speakOnOpen = true,
}) => {
  useEffect(() => {
    if (isOpen && speakOnOpen) {
      audioService.speak(`${title}. ${message}`);
    }
  }, [isOpen, title, message, speakOnOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-confirm-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div
        id="modal-confirm-content"
        className="w-full max-w-lg rounded-3xl bg-[#FFFDF7] p-6 sm:p-8 text-[#1A1816] shadow-2xl border-4 border-amber-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4 text-amber-900">
          <div className="p-3 bg-amber-100 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-amber-700" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-stone-900 leading-tight">
            {title}
          </h2>
        </div>

        <p className="text-xl text-stone-800 leading-relaxed mb-8 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
          {message}
        </p>

        <div className="flex flex-col gap-4">
          {/* One primary action */}
          <button
            id="btn-confirm-action"
            onClick={onConfirm}
            className="w-full min-h-[68px] rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-2xl px-6 py-4 shadow-md transition-all active:scale-98"
          >
            {confirmLabel}
          </button>

          {/* One giant back choice */}
          <button
            id="btn-confirm-cancel"
            onClick={onCancel}
            className="w-full min-h-[64px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xl px-6 py-3 border-2 border-stone-300 transition-all"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
