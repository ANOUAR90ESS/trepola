import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqBlock as FaqBlockType } from '../../types/articleBlocks';

export const FaqBlock: React.FC<{ block: FaqBlockType }> = ({ block }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
    <h4 className="font-headline font-black text-sm text-[#101418] dark:text-white px-5 pt-5 pb-2">
      Preguntas frecuentes
    </h4>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {block.items.map((item, i) => (
        <details key={i} className="group px-5 py-3">
          <summary className="flex items-center justify-between cursor-pointer list-none font-body font-semibold text-sm text-[#101418] dark:text-white">
            <span>{item.question}</span>
            <ChevronDown className="w-4 h-4 text-[#5b6470] transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="font-body text-sm text-[#5b6470] dark:text-slate-400 mt-2">{item.answer}</p>
        </details>
      ))}
    </div>
  </div>
);

export default FaqBlock;
