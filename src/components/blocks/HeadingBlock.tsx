import React from 'react';
import type { HeadingBlock as HeadingBlockType } from '../../types/articleBlocks';

const ASPECT_CLASS: Record<string, string> = {
  '16:9': 'aspect-video',
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
};

export const HeadingBlock: React.FC<{ block: HeadingBlockType }> = ({ block }) => {
  const level = block.level || 2;
  const Tag = level === 3 ? 'h3' : 'h2';
  const sizeClass = level === 3 ? 'text-xl' : 'text-3xl';
  const image = block.image;
  const showImage = image?.status === 'ready' && !!image.current?.url;
  const aspectClass = ASPECT_CLASS[image?.aspectRatio || '16:9'] || 'aspect-video';

  return (
    <div className="space-y-4">
      <Tag className={`font-headline font-black ${sizeClass} text-[#101418] dark:text-white tracking-tight`}>
        {block.text}
      </Tag>
      {showImage && (
        <figure className="space-y-2">
          <div className={`${aspectClass} rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800`}>
            <img
              src={image!.current!.url}
              alt={image!.alt || block.text}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          {image!.caption && (
            <figcaption className="text-sm font-body text-[#5b6470] text-center">
              {image!.caption}
            </figcaption>
          )}
        </figure>
      )}
    </div>
  );
};

export default HeadingBlock;
