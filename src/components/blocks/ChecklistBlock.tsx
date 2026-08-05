import React from 'react';
import { Check } from 'lucide-react';
import type { ChecklistBlock as ChecklistBlockType } from '../../types/articleBlocks';

export const ChecklistBlock: React.FC<{ block: ChecklistBlockType }> = ({ block }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
    <h4 className="font-headline font-black text-sm text-[#101418] dark:text-white mb-3">{block.title}</h4>
    <ul className="space-y-2.5">
      {block.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-accent flex items-center justify-center mt-0.5">
            <Check className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          </span>
          <span className="font-body text-sm text-[#101418] dark:text-slate-200">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default ChecklistBlock;
