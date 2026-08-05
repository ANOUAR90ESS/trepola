import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { WarningBlock as WarningBlockType } from '../../types/articleBlocks';

export const WarningBlock: React.FC<{ block: WarningBlockType }> = ({ block }) => (
  <div className="rounded-xl bg-warning-bg p-4 flex items-start gap-3">
    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
    <p className="font-body text-sm text-warning">{block.text}</p>
  </div>
);

export default WarningBlock;
