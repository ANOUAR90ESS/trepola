import React from 'react';
import { Check, X } from 'lucide-react';
import type { ComparisonTableBlock as ComparisonTableBlockType } from '../../types/articleBlocks';

function renderCell(value: string) {
  const trimmed = value.trim();
  if (trimmed === '✓' || /^s[ií]$/i.test(trimmed)) {
    return (
      <span className="inline-flex items-center gap-1 text-success font-semibold">
        <Check className="w-4 h-4" aria-hidden="true" /> {trimmed === '✓' ? '' : trimmed}
      </span>
    );
  }
  if (trimmed === '✗' || /^no$/i.test(trimmed)) {
    return (
      <span className="inline-flex items-center gap-1 text-accent font-semibold">
        <X className="w-4 h-4" aria-hidden="true" /> {trimmed === '✗' ? '' : trimmed}
      </span>
    );
  }
  return trimmed;
}

export const ComparisonTableBlock: React.FC<{ block: ComparisonTableBlockType }> = ({ block }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
    <h4 className="font-headline font-black text-sm text-[#101418] dark:text-white px-5 pt-5 pb-3">{block.title}</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#1c2126] text-white">
          <tr>
            <th className="text-left font-body font-semibold px-4 py-2.5"></th>
            {block.columns.map((col, i) => (
              <th key={i} className="text-left font-body font-semibold px-4 py-2.5">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
              <td className="font-body font-bold px-4 py-2.5 text-[#101418] dark:text-white">{row.label}</td>
              {row.values.map((v, j) => (
                <td key={j} className="font-body px-4 py-2.5 text-[#101418] dark:text-slate-200">{renderCell(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ComparisonTableBlock;
