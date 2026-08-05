import React, { useState } from 'react';
import { Wand2, Loader2, Trash2, Pencil, Image as ImageIcon } from 'lucide-react';
import type { SectionImage } from '../types/articleBlocks';

const STATUS_LABEL: Record<SectionImage['status'], string> = {
  none: 'Sin prompt',
  prompt_ready: 'Pendiente',
  generating: 'Generando…',
  ready: 'Lista',
  failed: 'Error',
};

const STATUS_CLASS: Record<SectionImage['status'], string> = {
  none: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  prompt_ready: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  generating: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
};

interface SectionImageCardProps {
  heading: string;
  image: SectionImage;
  generating: boolean;
  error?: string | null;
  onGenerate: (promptOverride?: string) => void;
  onSavePrompt: (prompt: string) => void;
  onClear: () => void;
}

export const SectionImageCard: React.FC<SectionImageCardProps> = ({
  heading,
  image,
  generating,
  error,
  onGenerate,
  onSavePrompt,
  onClear,
}) => {
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState(image.prompt || '');

  const status: SectionImage['status'] = generating ? 'generating' : image.status;

  const handleSavePrompt = () => {
    onSavePrompt(promptDraft.trim());
    setEditingPrompt(false);
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{heading}</p>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_CLASS[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {status === 'ready' && image.current ? (
        <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-md">
          <img
            src={image.current.url}
            alt={image.alt || heading}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600">
          {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</p>
      )}

      {editingPrompt ? (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={promptDraft}
            onChange={(e) => setPromptDraft(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 p-2.5 rounded-xl text-[11px] font-mono border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSavePrompt}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => { setPromptDraft(image.prompt || ''); setEditingPrompt(false); }}
              className="text-[11px] font-bold text-slate-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{image.prompt}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onGenerate()}
          disabled={generating}
          className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-[11px] px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          <span>{status === 'ready' ? 'Regenerar' : 'Generar imagen'}</span>
        </button>
        {!editingPrompt && (
          <button
            type="button"
            onClick={() => setEditingPrompt(true)}
            disabled={generating}
            className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 py-2 flex items-center gap-1 disabled:opacity-50"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar prompt
          </button>
        )}
        {status === 'ready' && (
          <button
            type="button"
            onClick={onClear}
            disabled={generating}
            className="text-[11px] font-bold text-slate-400 hover:text-red-500 px-2 py-2 flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionImageCard;
