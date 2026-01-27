
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in overflow-hidden border border-slate-200">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
        
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        
        <p className="text-slate-600 mb-8 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md shadow-blue-100"
          >
            Yes, Add it
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
};
