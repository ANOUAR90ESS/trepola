import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { DecisionTreeBlock as DecisionTreeBlockType } from '../../types/articleBlocks';

export const DecisionTreeBlock: React.FC<{ block: DecisionTreeBlockType }> = ({ block }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
    <h4 className="font-headline font-black text-base text-[#101418] dark:text-white mb-4">{block.question}</h4>
    <div className="space-y-3">
      {block.branches.map((branch, i) => (
        <div key={i} className="rounded-lg bg-slate-50 dark:bg-slate-800 border-l-4 border-accent p-4 space-y-2">
          <p className="font-body text-sm font-bold text-[#101418] dark:text-white">{branch.condition}</p>
          <div className="flex items-start gap-2 pl-1">
            <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-body text-sm text-[#5b6470] dark:text-slate-300">{branch.outcome}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default DecisionTreeBlock;
