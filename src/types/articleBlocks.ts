// Content block schema for AI-generated "interactive execution guide" articles.
// See DESIGN.md for the visual spec of each block type.

export interface StatCardBlock {
  type: 'stat-card';
  title: string;
  stats: { value: string; label: string }[];
}

export interface ComparisonTableBlock {
  type: 'comparison-table';
  title: string;
  columns: string[];
  rows: { label: string; values: string[] }[];
}

export interface BarChartBlock {
  type: 'bar-chart';
  title: string;
  source?: string;
  bars: { label: string; value: number; displayValue: string }[];
}

export interface StepsBlock {
  type: 'steps';
  title: string;
  steps: { title: string; body: string }[];
}

export interface UiWalkthroughBlock {
  type: 'ui-walkthrough';
  context: string;
  callout: string;
  explanation: string;
  result: string;
}

export interface ChecklistBlock {
  type: 'checklist';
  title: string;
  items: string[];
}

export interface TimelineBlock {
  type: 'timeline';
  title: string;
  events: { date: string; text: string }[];
}

export interface WarningBlock {
  type: 'warning';
  text: string;
}

export interface TipBlock {
  type: 'tip';
  text: string;
}

export interface VerificationBlock {
  type: 'verification-block';
  question: string;
  expected: string;
}

export interface TroubleshootingBlock {
  type: 'troubleshooting';
  title: string;
  items: { problem: string; solution: string }[];
}

export interface DecisionTreeBlock {
  type: 'decision-tree';
  question: string;
  branches: { condition: string; outcome: string }[];
}

export interface QuizBlock {
  type: 'quiz';
  question: string;
  options: string[];
  correctIndex: number;
}

export interface PracticeBlock {
  type: 'practice-block';
  title: string;
  instructions: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface HeadingBlock {
  type: 'heading';
  text: string;
  level?: 2 | 3;
}

export type ContentBlock =
  | StatCardBlock
  | ComparisonTableBlock
  | BarChartBlock
  | StepsBlock
  | UiWalkthroughBlock
  | ChecklistBlock
  | TimelineBlock
  | WarningBlock
  | TipBlock
  | VerificationBlock
  | TroubleshootingBlock
  | DecisionTreeBlock
  | QuizBlock
  | PracticeBlock
  | ParagraphBlock
  | HeadingBlock;

export const BLOCK_TYPES = [
  'stat-card',
  'comparison-table',
  'bar-chart',
  'steps',
  'ui-walkthrough',
  'checklist',
  'timeline',
  'warning',
  'tip',
  'verification-block',
  'troubleshooting',
  'decision-tree',
  'quiz',
  'practice-block',
  'paragraph',
  'heading',
] as const;

export interface InteractiveArticleData {
  title: string;
  excerpt: string;
  category?: string;
  seoKeywords?: string[];
  metaDescription?: string;
  estimatedCompletionMinutes?: number;
  blocks: ContentBlock[];
}
