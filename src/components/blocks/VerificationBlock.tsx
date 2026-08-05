import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { VerificationBlock as VerificationBlockType } from '../../types/articleBlocks';

export const VerificationBlock: React.FC<{ block: VerificationBlockType }> = ({ block }) => (
  <div className="rounded-xl bg-success-bg p-5">
    <div className="flex items-center gap-2 mb-2">
      <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
      <p className="font-headline font-extrabold text-sm text-success">{block.question}</p>
    </div>
    <p className="font-body text-sm text-success/90 pl-7">{block.expected}</p>
  </div>
);

export default VerificationBlock;
