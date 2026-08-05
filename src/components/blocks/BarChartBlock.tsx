import React from 'react';
import type { BarChartBlock as BarChartBlockType } from '../../types/articleBlocks';

export const BarChartBlock: React.FC<{ block: BarChartBlockType }> = ({ block }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
    <h4 className="font-headline font-black text-sm text-[#101418] dark:text-white mb-4">{block.title}</h4>
    <div className="space-y-3">
      {block.bars.map((bar, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-body text-xs font-semibold text-[#101418] dark:text-slate-200">{bar.label}</span>
            <span className="font-body text-xs font-bold text-accent">{bar.displayValue}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, bar.value))}%`,
                background: 'linear-gradient(90deg, #f472a0, #E11D3C)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
    {block.source && (
      <p className="font-body text-[11px] text-[#5b6470] dark:text-slate-500 mt-4">Fuente: {block.source}</p>
    )}
  </div>
);

export default BarChartBlock;
