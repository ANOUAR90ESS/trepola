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

// Per-image generation metadata — one entry per generated version, so
// regenerating a section image keeps history instead of destroying it.
export interface GeneratedImageMetadata {
  provider: string; // opaque id, e.g. 'openai' — never branched on by the UI
  model?: string;
  seed?: string | number;
  width?: number;
  height?: number;
  style?: string;
  promptUsed: string;
  negativePromptUsed?: string;
  // Open bag for provider-specific extras that don't warrant a typed field yet.
  generationParams?: Record<string, unknown>;
  version: number;
  jobId: string;
  createdAt: string;
  url: string;
}

export interface SectionImage {
  status: 'none' | 'prompt_ready' | 'generating' | 'ready' | 'failed';
  prompt?: string;
  negativePrompt?: string;
  alt?: string;
  caption?: string;
  aspectRatio?: '16:9' | '1:1' | '4:5';
  style?: string;
  current?: GeneratedImageMetadata;
  history?: GeneratedImageMetadata[];
  error?: string;
}

export interface HeadingBlock {
  type: 'heading';
  text: string;
  level?: 2 | 3;
  // Stable id used to target this section from image-generation jobs.
  sectionId?: string;
  image?: SectionImage;
}

export interface FaqBlock {
  type: 'faq';
  items: { question: string; answer: string }[];
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
  | HeadingBlock
  | FaqBlock;

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
  'faq',
] as const;

export interface InteractiveArticleData {
  title: string;
  excerpt: string;
  category?: string;
  seoKeywords?: string[];
  metaDescription?: string;
  estimatedCompletionMinutes?: number;
  blocks: ContentBlock[];
  faq?: { question: string; answer: string }[];
  internalLinkSuggestions?: { slug: string; anchorText: string }[];
  heroImage?: SectionImage;
}
