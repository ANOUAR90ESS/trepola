import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { QuizBlock as QuizBlockType } from '../../types/articleBlocks';

export const QuizBlock: React.FC<{ block: QuizBlockType }> = ({ block }) => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="rounded-xl border-2 border-accent/30 bg-white dark:bg-slate-900 p-5">
      <p className="font-headline font-extrabold text-base text-[#101418] dark:text-white mb-4">{block.question}</p>
      <div className="space-y-2">
        {block.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrect = i === block.correctIndex;
          const showState = selected !== null && (isSelected || isCorrect);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-lg border font-body text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
                showState && isCorrect
                  ? 'bg-success-bg border-success text-success font-semibold'
                  : showState && isSelected && !isCorrect
                  ? 'bg-accent/10 border-accent text-accent font-semibold'
                  : 'border-slate-200 dark:border-slate-700 text-[#101418] dark:text-slate-200 hover:border-accent/50'
              }`}
            >
              <span>{option}</span>
              {showState && isCorrect && <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
              {showState && isSelected && !isCorrect && <X className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizBlock;
