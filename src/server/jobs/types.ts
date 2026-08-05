import type { JobType } from '../../types/workflow.js';

export interface JobContext {
  articleId?: string;
  targetRef?: string;
}

export interface JobHandler<TInput = any, TOutput = any> {
  type: JobType;
  run(input: TInput, ctx: JobContext): Promise<TOutput>;
}
