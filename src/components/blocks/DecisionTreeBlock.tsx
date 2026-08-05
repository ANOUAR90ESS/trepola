import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { DecisionTreeBlock as DecisionTreeBlockType } from '../../types/articleBlocks';

export const DecisionTreeBlock: React.FC<{ block: DecisionTreeBlockType }> = ({ block }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
    <h4 className="font-headline font-black text-base text-[#101418] dark:text-white mb-4">{block.question}</h4>
    <div className="space-y-3">
      {block.branches.map((branch, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
          <span className="font-body text-xs font-bold px-2.5 py-1 rounded-md bg-accent text-white flex-shrink-0">
            {branch.condition}
          </span>
          <ArrowRight className="w-4 h-4 text-[#5b6470] flex-shrink-0" aria-hidden="true" />
          <span className="font-body text-sm text-[#101418] dark:text-slate-200">{branch.outcome}</span>
        </div>
      ))}
    </div>
  </div>
);

export default DecisionTreeBlock;
