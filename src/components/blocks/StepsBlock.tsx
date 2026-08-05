import React from 'react';
import type { StepsBlock as StepsBlockType } from '../../types/articleBlocks';

export const StepsBlock: React.FC<{ block: StepsBlockType }> = ({ block }) => (
  <div>
    <h4 className="font-headline font-black text-lg text-[#101418] dark:text-white mb-4">{block.title}</h4>
    <ol className="space-y-5">
      {block.steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-white font-headline font-black text-sm flex items-center justify-center">
            {i + 1}
          </span>
          <div>
            <p className="font-headline font-extrabold text-[15px] text-[#101418] dark:text-white">{step.title}</p>
            <p className="font-body text-sm text-[#5b6470] dark:text-slate-400 mt-1">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  </div>
);

export default StepsBlock;
