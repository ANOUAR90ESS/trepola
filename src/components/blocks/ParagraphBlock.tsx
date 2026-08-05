import React from 'react';
import type { ParagraphBlock as ParagraphBlockType } from '../../types/articleBlocks';

export const ParagraphBlock: React.FC<{ block: ParagraphBlockType }> = ({ block }) => (
  <p className="font-body text-[15px] leading-relaxed text-[#101418] dark:text-slate-200 max-w-[760px]">
    {block.text}
  </p>
);

export default ParagraphBlock;
