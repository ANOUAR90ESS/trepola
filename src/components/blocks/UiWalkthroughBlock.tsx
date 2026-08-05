import React from 'react';
import type { UiWalkthroughBlock as UiWalkthroughBlockType } from '../../types/articleBlocks';

export const UiWalkthroughBlock: React.FC<{ block: UiWalkthroughBlockType }> = ({ block }) => (
  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
    <div className="bg-[#1c2126] text-white p-6 relative">
      <p className="font-mono text-[11px] text-slate-400 mb-4 truncate">{block.context}</p>
      <div className="relative inline-flex items-start gap-3 max-w-full">
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-[#1c2126] font-headline font-black text-xs flex items-center justify-center ring-4 ring-accent"
          aria-hidden="true"
        >
          1
        </span>
        <span className="font-body text-sm font-semibold text-white pt-0.5">{block.callout}</span>
      </div>
    </div>
    <div className="bg-white dark:bg-slate-900 p-5 space-y-2">
      <p className="font-body text-sm text-[#101418] dark:text-slate-200">{block.explanation}</p>
      <p className="font-body text-sm text-[#5b6470] dark:text-slate-400">
        <span className="font-bold text-success">Resultado: </span>
        {block.result}
      </p>
    </div>
  </div>
);

export default UiWalkthroughBlock;
