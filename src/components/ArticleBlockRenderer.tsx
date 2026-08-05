import React from 'react';
import type { ContentBlock } from '../types/articleBlocks';
import {
  StatCardBlock,
  ComparisonTableBlock,
  BarChartBlock,
  StepsBlock,
  UiWalkthroughBlock,
  ChecklistBlock,
  TimelineBlock,
  WarningBlock,
  TipBlock,
  VerificationBlock,
  TroubleshootingBlock,
  DecisionTreeBlock,
  QuizBlock,
  PracticeBlock,
  ParagraphBlock,
  HeadingBlock,
} from './blocks';

const BlockDispatch: React.FC<{ block: ContentBlock }> = ({ block }) => {
  switch (block.type) {
    case 'stat-card':
      return <StatCardBlock block={block} />;
    case 'comparison-table':
      return <ComparisonTableBlock block={block} />;
    case 'bar-chart':
      return <BarChartBlock block={block} />;
    case 'steps':
      return <StepsBlock block={block} />;
    case 'ui-walkthrough':
      return <UiWalkthroughBlock block={block} />;
    case 'checklist':
      return <ChecklistBlock block={block} />;
    case 'timeline':
      return <TimelineBlock block={block} />;
    case 'warning':
      return <WarningBlock block={block} />;
    case 'tip':
      return <TipBlock block={block} />;
    case 'verification-block':
      return <VerificationBlock block={block} />;
    case 'troubleshooting':
      return <TroubleshootingBlock block={block} />;
    case 'decision-tree':
      return <DecisionTreeBlock block={block} />;
    case 'quiz':
      return <QuizBlock block={block} />;
    case 'practice-block':
      return <PracticeBlock block={block} />;
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'heading':
      return <HeadingBlock block={block} />;
    default:
      // Unknown block type from a model response — degrade gracefully instead of crashing the article page.
      if (import.meta.env.DEV) {
        console.warn('ArticleBlockRenderer: unknown block type', block);
      }
      return null;
  }
};

export const ArticleBlockRenderer: React.FC<{ blocks: ContentBlock[] }> = ({ blocks }) => (
  <div className="max-w-[760px] mx-auto space-y-8">
    {blocks.map((block, i) => (
      <BlockDispatch key={i} block={block} />
    ))}
  </div>
);

export default ArticleBlockRenderer;
