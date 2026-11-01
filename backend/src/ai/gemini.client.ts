import { Injectable, Logger } from '@nestjs/common';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 20_000;
const TRANSIENT_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAYS_MS = [1000, 3000];

export type GeminiErrorKind = 'not_configured' | 'unavailable';

export class GeminiError extends Error {
  constructor(readonly kind: GeminiErrorKind) {
    super(`Gemini: ${kind}`);
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);

  get isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL);
  }

  get model() {
    return process.env.GEMINI_MODEL ?? '';
  }

  // Lỗi từ Google chỉ ghi mã trạng thái, không trả nội dung cho người dùng
  async generateJson(prompt: string, schema: object) {
    if (!this.isConfigured) throw new GeminiError('not_configured');

    for (let attempt = 0; ; attempt += 1) {
      const response = await this.send(prompt, schema);
      if (response.ok) {
        const data = (await response.json().catch(() => null)) as GeminiResponse | null;
        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        return parts.map((part) => part.text ?? '').join('');
      }

      this.logger.warn(`Gemini trả mã ${response.status}`);
      // Thử lại lỗi tạm thời vì đo thực tế model hay trả 503 khi quá tải
      const delay = RETRY_DELAYS_MS[attempt];
      if (!TRANSIENT_STATUSES.has(response.status) || delay === undefined) {
        throw new GeminiError('unavailable');
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  private async send(prompt: string, schema: object) {
    try {
      return await fetch(`${API_URL}/${encodeURIComponent(this.model)}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY ?? '',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: schema,
            temperature: 0.3,
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      // Không thử lại khi timeout để học viên không phải chờ quá lâu
      this.logger.warn(`Không gọi được Gemini: ${(error as Error).name}`);
      throw new GeminiError('unavailable');
    }
  }
}
