import React from 'react';
import { Lightbulb } from 'lucide-react';
import type { TipBlock as TipBlockType } from '../../types/articleBlocks';

export const TipBlock: React.FC<{ block: TipBlockType }> = ({ block }) => (
  <div className="rounded-xl bg-info-bg p-4 flex items-start gap-3">
    <Lightbulb className="w-5 h-5 text-info flex-shrink-0 mt-0.5" aria-hidden="true" />
    <p className="font-body text-sm text-info">{block.text}</p>
  </div>
);

export default TipBlock;
