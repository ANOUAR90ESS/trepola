import type { JobHandler } from './types.js';
import { getActiveImageProvider } from '../imageProviders/registry.js';

export interface ImageGenerationJobInput {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: '16:9' | '1:1' | '4:5';
  style?: string;
}

export interface ImageGenerationJobOutput {
  url: string;
  provider: string;
  model?: string;
  seed?: string | number;
  width?: number;
  height?: number;
  promptUsed: string;
  negativePromptUsed?: string;
  aspectRatio: string;
}

// `uploadToStorage` is injected so this module never has to know about
// Supabase — it reuses the existing uploadBase64ToStorage helper in server.ts.
export function createImageGenerationJobHandler(
  uploadToStorage: (base64: string) => Promise<string | null>,
): JobHandler<ImageGenerationJobInput, ImageGenerationJobOutput> {
  return {
    type: 'image_generation',
    async run(input) {
      const provider = getActiveImageProvider();
      const result = await provider.generate({
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        aspectRatio: input.aspectRatio,
      });

      let url = result.url || '';
      if (!url && result.base64) {
        url = (await uploadToStorage(result.base64)) || '';
      }
      if (!url) {
        throw new Error('Image provider returned no usable image');
      }

      return {
        url,
        provider: result.provider,
        model: result.model,
        seed: result.seed,
        width: result.width,
        height: result.height,
        promptUsed: input.prompt,
        negativePromptUsed: input.negativePrompt,
        aspectRatio: input.aspectRatio,
      };
    },
  };
}
