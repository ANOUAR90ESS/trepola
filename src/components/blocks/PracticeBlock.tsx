import React from 'react';
import { Target } from 'lucide-react';
import type { PracticeBlock as PracticeBlockType } from '../../types/articleBlocks';

export const PracticeBlock: React.FC<{ block: PracticeBlockType }> = ({ block }) => (
  <div className="rounded-xl border-l-4 border-accent bg-white dark:bg-slate-900 p-5">
    <div className="flex items-center gap-2 mb-2">
      <Target className="w-4 h-4 text-accent" aria-hidden="true" />
      <h4 className="font-headline font-black text-sm text-[#101418] dark:text-white">{block.title}</h4>
    </div>
    <p className="font-body text-sm text-[#5b6470] dark:text-slate-400">{block.instructions}</p>
  </div>
);

export default PracticeBlock;
