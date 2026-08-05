import React from 'react';
import type { HeadingBlock as HeadingBlockType } from '../../types/articleBlocks';

export const HeadingBlock: React.FC<{ block: HeadingBlockType }> = ({ block }) => {
  const level = block.level || 2;
  const Tag = level === 3 ? 'h3' : 'h2';
  const sizeClass = level === 3 ? 'text-xl' : 'text-3xl';
  return (
    <Tag className={`font-headline font-black ${sizeClass} text-[#101418] dark:text-white tracking-tight`}>
      {block.text}
    </Tag>
  );
};

export default HeadingBlock;
