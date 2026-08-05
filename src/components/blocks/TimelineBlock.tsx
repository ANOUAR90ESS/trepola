import React from 'react';
import type { TimelineBlock as TimelineBlockType } from '../../types/articleBlocks';

export const TimelineBlock: React.FC<{ block: TimelineBlockType }> = ({ block }) => (
  <div>
    <h4 className="font-headline font-black text-sm text-[#101418] dark:text-white mb-4">{block.title}</h4>
    <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-6">
      {block.events.map((event, i) => (
        <li key={i} className="ml-5 relative">
          <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-accent" aria-hidden="true" />
          <p className="font-headline font-extrabold text-xs text-accent uppercase tracking-wide">{event.date}</p>
          <p className="font-body text-sm text-[#101418] dark:text-slate-200 mt-0.5">{event.text}</p>
        </li>
      ))}
    </ol>
  </div>
);

export default TimelineBlock;
