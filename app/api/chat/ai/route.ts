import OpenAI from 'openai';
import Bytez from 'bytez.js';
import Chat from '@/models/Chat';
import connectDB from '@/config/db';
import { getUserIdFromRequest } from '@/lib/firebaseAuth';
import { NextRequest, NextResponse } from 'next/server';

const MODEL_CONFIG: Record<
  string,
  { baseURL: string; apiKey: string; model: string }
> = {
  deepseek: {
    baseURL: process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || '',
    apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
    model: process.env.NEXT_PUBLIC_DEEPSEEK_MODEL || '',
  },
  openai: {
    baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL || '',
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    model: process.env.NEXT_PUBLIC_OPENAI_MODEL || '',
  },
  grok: {
    baseURL: process.env.NEXT_PUBLIC_GROK_BASE_URL || '',
    apiKey: process.env.NEXT_PUBLIC_GROK_API_KEY || '',
    model: process.env.NEXT_PUBLIC_GROK_MODEL || '',
  },
  gemini: {
    baseURL: process.env.NEXT_PUBLIC_GEMINI_BASE_URL || '',
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    model: process.env.NEXT_PUBLIC_GEMINI_MODEL || '',
  },
  claude: {
    baseURL: process.env.NEXT_PUBLIC_CLAUDE_BASE_URL || '',
    apiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '',
    model: process.env.NEXT_PUBLIC_CLAUDE_MODEL || '',
  },
};

const OPENROUTER_CONFIG = {
  baseURL: process.env.OPEN_ROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPEN_ROUTER_API_KEY || '',
};

const OPENROUTER_MODELS: Record<string, string> = {
  deepseek: 'deepseek/deepseek-chat',
  openai: 'openai/gpt-3.5-turbo',
  grok: 'xai/grok-2',
  gemini: 'google/gemini-2.0-flash',
  claude: 'anthropic/claude-3-haiku',
};

const BYTEZ_CONFIG: Record<string, { apiKey: string; model: string }> = {
  deepseek: {
    apiKey: process.env.NEXT_PUBLIC_BYTEZ_API_KEY || '',
    model: process.env.NEXT_PUBLIC_BYTEZ_DEEPSEEK_MODEL || '',
  },
  openai: {
    apiKey: process.env.NEXT_PUBLIC_BYTEZ_API_KEY || '',
    model: process.env.NEXT_PUBLIC_BYTEZ_OPENAI_MODEL || '',
  },
  grok: {
    apiKey: process.env.NEXT_PUBLIC_BYTEZ_API_KEY || '',
    model: process.env.NEXT_PUBLIC_BYTEZ_GROK_MODEL || '',
  },
  gemini: {
    apiKey: process.env.NEXT_PUBLIC_BYTEZ_API_KEY || '',
    model: process.env.NEXT_PUBLIC_BYTEZ_GEMINI_MODEL || '',
  },
  claude: {
    apiKey: process.env.NEXT_PUBLIC_BYTEZ_API_KEY || '',
    model: process.env.NEXT_PUBLIC_BYTEZ_CLAUDE_MODEL || '',
  },
};

console.log('Available models:', Object.keys(MODEL_CONFIG));

interface ChatRequestBody {
  chatId: string;
  prompt: string;
  images?: string[];
  model?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

async function* generateAIResponse(
  modelConfig: any,
  model: string,
  contentMessage: any,
  prompt: string,
): AsyncGenerator<string, void, unknown> {
  if (modelConfig.apiKey) {
    try {
      console.log(
        `[Priority 1] Using official API: ${model} (${modelConfig.model})`,
      );

      const openai = new OpenAI({
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
      });

      yield* streamOpenAIResponse(
        openai,
        [{ role: 'user', content: contentMessage }],
        modelConfig.model,
      );
      console.log(`Official API succeeded for ${model}`);
      return;
    } catch (officialError: any) {
      console.warn(
        `[Priority 1 Failed] Official API failed for ${model}: ${officialError.message}. Trying OpenRouter...`,
      );
    }
  }

  if (OPENROUTER_CONFIG.apiKey) {
    try {
      console.log(`[Priority 2] Using OpenRouter for ${model}`);

      const openrouter = new OpenAI({
        baseURL: OPENROUTER_CONFIG.baseURL,
        apiKey: OPENROUTER_CONFIG.apiKey,
        defaultHeaders: {
          'HTTP-Referer': 'https://omg-ai.vercel.app',
          'X-Title': 'OMG AI',
        },
      });

      const openrouterModel =
        OPENROUTER_MODELS[model] || OPENROUTER_MODELS.deepseek;

      yield* streamOpenAIResponse(
        openrouter,
        [{ role: 'user', content: contentMessage }],
        openrouterModel,
      );
      console.log(`✓ OpenRouter succeeded for ${model}`);
      return;
    } catch (openrouterError: any) {
      console.warn(
        `[Priority 2 Failed] OpenRouter failed for ${model}: ${openrouterError.message}. Trying BYTEZ...`,
      );
    }
  }

  try {
    console.log(`[Priority 3] Using BYTEZ for ${model}`);
    const bytezConfig =
      BYTEZ_CONFIG[model as keyof typeof BYTEZ_CONFIG] || BYTEZ_CONFIG.deepseek;

    yield* streamBytezResponse(bytezConfig, prompt);
    console.log(`BYTEZ succeeded for ${model}`);
    return;
  } catch (bytezError: any) {
    console.error(`[Priority 3 Failed] All APIs failed: ${bytezError.message}`);
    throw new Error(`All APIs failed: ${bytezError.message}`);
  }
}

function createStreamingResponse(
  generator: AsyncGenerator<string, void, unknown>,
) {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });
}

async function* streamOpenAIResponse(
  openai: OpenAI,
  messages: any,
  model: string,
) {
  const stream = await openai.chat.completions.create({
    messages,
    model,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      yield content;
    }
  }
}

async function* streamBytezResponse(bytezConfig: any, prompt: string) {
  const sdk = new Bytez(bytezConfig.apiKey);
  const bytezModel = sdk.model(bytezConfig.model);
  const { error, output } = await bytezModel.run(prompt);

  if (error) {
    throw new Error(`Bytez.js error: ${error}`);
  }

  yield output || 'No response generated';
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const userId = await getUserIdFromRequest(req);
    const {
      chatId,
      prompt,
      images = [],
      model = 'deepseek',
    }: ChatRequestBody = await req.json();

    const contentMessage =
      images.length > 0
        ? [
            { type: 'text' as const, text: prompt },
            ...images.map((image) => ({
              type: 'image_url' as const,
              image_url: { url: image },
            })),
          ]
        : prompt;

    const modelConfig =
      MODEL_CONFIG[model as keyof typeof MODEL_CONFIG] || MODEL_CONFIG.deepseek;

    let chatData: any = null;
    if (userId) {
      await connectDB();
      chatData = await Chat.findOne({ userId, _id: chatId });
      if (!chatData) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: 'Chat not found',
          }),
          { status: 404 },
        );
      }
    }

    const userPrompt = {
      role: 'user' as const,
      content:
        images.length > 0
          ? [
              { type: 'text' as const, text: prompt },
              ...images.map((image) => ({
                type: 'image_url' as const,
                image_url: { url: image },
              })),
            ]
          : prompt,
      timestamp: Date.now(),
    };

    if (chatData) {
      chatData.messages.push(userPrompt);
      await chatData.save();
    }

    let fullResponse = '';
    const generator = generateAIResponse(
      modelConfig,
      model,
      contentMessage,
      prompt,
    );

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            fullResponse += chunk;
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(chunk));
          }

          if (chatData && fullResponse) {
            try {
              chatData.messages.push({
                role: 'assistant',
                content: fullResponse,
                timestamp: Date.now(),
                isVoiceMessage: false,
              });
              await chatData.save();
              console.log('Assistant message saved to database');
            } catch (saveError: any) {
              console.error('Error saving assistant message:', saveError);
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return new NextResponse(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 },
    );
  }
}
