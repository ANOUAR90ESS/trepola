import type OpenAI from 'openai';
import type { ImageProvider, ImageGenerationRequest, ImageGenerationResult } from './types.js';

const ASPECT_TO_SIZE: Record<ImageGenerationRequest['aspectRatio'], '1024x1024' | '1536x1024' | '1024x1536'> = {
  '1:1': '1024x1024',
  '16:9': '1536x1024',
  '4:5': '1024x1536',
};

// Wraps the same gpt-image-1 call already used by /api/ai/generate-image —
// no behavior change to that endpoint, this just exposes it through the
// generic ImageProvider contract for the Job system.
export class OpenAIImageProvider implements ImageProvider {
  readonly id = 'openai';

  constructor(private getClient: () => OpenAI | null) {}

  async generate(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const client = this.getClient();
    if (!client) throw new Error('OpenAI client not configured (missing OPENAI_API_KEY)');

    const size = ASPECT_TO_SIZE[req.aspectRatio] || '1024x1024';
    const fullPrompt = req.negativePrompt
      ? `${req.prompt}\n\nAvoid: ${req.negativePrompt}`
      : req.prompt;

    const response = await client.images.generate({
      model: 'gpt-image-1',
      prompt: fullPrompt,
      n: 1,
      size,
    });

    const first = response.data?.[0];
    if (!first || (!first.url && !first.b64_json)) {
      throw new Error('OpenAI returned no image data');
    }

    return {
      url: first.url,
      base64: first.b64_json,
      provider: this.id,
      model: 'gpt-image-1',
    };
  }
}
