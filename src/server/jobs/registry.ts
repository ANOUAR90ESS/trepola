import type { JobHandler } from './types.js';
import type { JobType } from '../../types/workflow.js';

const handlers: Partial<Record<JobType, JobHandler>> = {};

export function registerJobHandler(handler: JobHandler): void {
  handlers[handler.type] = handler;
}

export function getJobHandler(type: JobType): JobHandler {
  const handler = handlers[type];
  if (!handler) {
    throw new Error(`No handler registered for job type "${type}"`);
  }
  return handler;
}
