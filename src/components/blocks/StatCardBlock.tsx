import React from 'react';
import type { StatCardBlock as StatCardBlockType } from '../../types/articleBlocks';

export const StatCardBlock: React.FC<{ block: StatCardBlockType }> = ({ block }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
    <div className="border-l-4 border-accent p-5">
      <h4 className="font-headline font-black text-sm text-[#101418] dark:text-white mb-4">{block.title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {block.stats.map((s, i) => (
          <div key={i}>
            <div className="font-headline font-black text-3xl text-accent leading-none">{s.value}</div>
            <div className="font-body text-xs text-[#5b6470] dark:text-slate-400 mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default StatCardBlock;
