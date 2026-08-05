import type { ImageProvider } from './types.js';

const providers: Record<string, ImageProvider> = {};

export function registerImageProvider(provider: ImageProvider): void {
  providers[provider.id] = provider;
}

// Active provider is server config only (IMAGE_PROVIDER env var). No API
// route or UI component should ever read/branch on this id — adding a new
// provider means registering it here, nothing else changes.
export function getActiveImageProvider(): ImageProvider {
  const id = process.env.IMAGE_PROVIDER || 'openai';
  const provider = providers[id] || providers['openai'];
  if (!provider) {
    throw new Error('No image provider registered');
  }
  return provider;
}
