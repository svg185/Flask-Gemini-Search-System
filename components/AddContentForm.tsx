
import React, { useState } from 'react';
import { storageService } from '../services/storageService';

interface AddContentFormProps {
  initialTitle?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddContentForm: React.FC<AddContentFormProps> = ({ initialTitle = '', onSuccess, onCancel }) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      storageService.save(title, content, 'manual');
      setIsSubmitting(false);
      onSuccess();
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Add New Knowledge</h2>
        <p className="text-slate-500">Contribute your own findings to the global search index.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Subject / Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
            placeholder="What is this about?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all h-40 bg-slate-50 focus:bg-white resize-none"
            placeholder="Explain it here..."
            required
          ></textarea>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Save Knowledge
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
