// Provider-agnostic image generation contract. No caller (API routes, UI)
// should depend on a specific provider's request/response shape — that
// translation lives entirely inside each adapter.

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: '16:9' | '1:1' | '4:5';
}

export interface ImageGenerationResult {
  // Adapters return whichever the underlying API gives them; callers
  // normalize (upload base64 to storage, or use the URL as-is).
  url?: string;
  base64?: string;
  provider: string;
  model?: string;
  seed?: string | number;
  width?: number;
  height?: number;
}

export interface ImageProvider {
  readonly id: string;
  generate(req: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
