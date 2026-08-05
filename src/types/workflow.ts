// Generic AI workflow types shared by client and server.
//
// The platform models article creation as a pipeline of independently
// re-runnable stages. Not every stage requires an async Job — deterministic
// derivations (SEO tags, schema.org, internal link suggestions) run inline.
// Stages that call an external AI provider (images today; audio, video,
// translation, social copy, newsletter copy in the future) go through the
// generic Job system instead of calling providers directly, so every such
// call has a uniform status/history/audit trail regardless of provider.

export type JobType =
  | 'image_generation'
  | 'audio_generation'
  | 'video_generation'
  | 'translation'
  | 'social_copy'
  | 'newsletter_copy';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface JobRecord<TInput = unknown, TOutput = unknown> {
  id: string;
  type: JobType;
  status: JobStatus;
  articleId?: string | null;
  // Identifies what within the article this job targets — a block's
  // sectionId for image_generation, a locale code for translation, etc.
  targetRef?: string | null;
  input: TInput;
  output?: TOutput | null;
  error?: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export type StageId =
  | 'research'
  | 'article'
  | 'seo'
  | 'schema'
  | 'internal_links'
  | 'image_prompts'
  | 'images'
  | 'audio'
  | 'translation'
  | 'social_media'
  | 'newsletter'
  | 'publish';

export type StageStatusValue = 'pending' | 'ready' | 'partial' | 'skipped';

export type StageStatusMap = Partial<
  Record<StageId, { status: StageStatusValue; updatedAt: string }>
>;
