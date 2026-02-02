
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { KnowledgeEntry } from '../types';

interface AddContentFormProps {
  initialTitle?: string;
  editEntry?: KnowledgeEntry | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddContentForm: React.FC<AddContentFormProps> = ({ initialTitle = '', editEntry = null, onSuccess, onCancel }) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title);
      setContent(editEntry.content);
      setImageUrl(editEntry.imageUrl || '');
    }
  }, [editEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setError('A descriptive Subject Title is mandatory.');
      return;
    }

    if (!trimmedContent) {
      setError('Elaborated content is required to expand the engine.');
      return;
    }

    setIsSubmitting(true);
    try {
      await storageService.save(trimmedTitle, trimmedContent, editEntry ? editEntry.source : 'manual', editEntry?.id, imageUrl.trim() || undefined);
      setIsSubmitting(false);
      onSuccess();
    } catch (err) {
      setError('System Error: Could not write to IndexedDB. Local storage is unavailable or corrupt.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[3rem] border border-slate-200 shadow-2xl p-16 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      
      <div className="mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-2xl shadow-inner border border-blue-100">
            <i className={`fas ${editEntry ? 'fa-pen-fancy' : 'fa-brain'}`}></i>
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {editEntry ? 'Refine Knowledge' : 'Expand Index'}
            </h2>
            <p className="text-slate-400 font-bold text-lg">
              {editEntry ? 'Updating core system records.' : 'Synthesize new multi-modal intelligence.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid md:grid-cols-2 gap-8">
           <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Asset Label</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-lg font-black"
              placeholder="e.g. Dark Matter"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Visual Endpoint (URL)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold"
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Briefing</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-8 py-8 rounded-3xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all h-96 resize-none text-lg leading-relaxed font-medium shadow-inner"
            placeholder="Synthesize a comprehensive briefing here..."
          ></textarea>
        </div>

        {error && (
          <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 text-sm font-black animate-fade-in uppercase tracking-widest">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-grow bg-slate-900 hover:bg-black text-white font-black py-6 rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-4 uppercase text-sm tracking-widest disabled:opacity-50"
          >
            {isSubmitting ? <i className="fas fa-cog fa-spin"></i> : 'Publish to Core Index'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-10 py-6 rounded-3xl font-black text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all uppercase text-sm tracking-widest"
          >
            Abort
          </button>
        </div>
      </form>
    </div>
  );
};
