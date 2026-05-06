import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/firebaseAuth';

interface TTSRequestBody {
  text: string;
  language?: string;
  voiceId?: string;
  model?: 'elevenlabs' | 'openai' | 'google';
  format?: 'mp3' | 'wav' | 'ogg';
}

async function convertWithElevenLabs(
  text: string,
  language: string = 'en',
  voiceId: string = 'EXAVITQu4vr4xnSDxMaL',
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

async function convertWithOpenAI(
  text: string,
  language: string = 'en',
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const voiceMap: Record<string, string> = {
    'en-US': 'alloy',
    'en-GB': 'nova',
    'es-ES': 'nova',
    'fr-FR': 'nova',
    'de-DE': 'nova',
    'ja-JP': 'nova',
    'zh-CN': 'nova',
  };

  const voice = voiceMap[language] || 'alloy';

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: text,
      voice,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

async function convertWithGoogle(
  text: string,
  language: string = 'en-US',
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_TTS_KEY not configured');
  }

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: language,
          ssmlGender: 'NEUTRAL',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: 1,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Cloud TTS error: ${error}`);
  }

  const data = await response.json();
  return Buffer.from(data.audioContent, 'base64');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      text,
      language = 'en-US',
      voiceId,
      model = 'openai',
      format = 'mp3',
    }: TTSRequestBody = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)' },
        { status: 400 },
      );
    }

    let audioBuffer: Buffer;

    switch (model) {
      case 'elevenlabs':
        audioBuffer = await convertWithElevenLabs(text, language, voiceId);
        break;
      case 'google':
        audioBuffer = await convertWithGoogle(text, language);
        break;
      case 'openai':
      default:
        audioBuffer = await convertWithOpenAI(text, language);
        break;
    }

    return new NextResponse(
      audioBuffer.buffer.slice(
        audioBuffer.byteOffset,
        audioBuffer.byteOffset + audioBuffer.byteLength,
      ) as any,
      {
        headers: {
          'Content-Type': `audio/${format}`,
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      },
    );
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { error: `TTS conversion failed: ${String(error)}` },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const model = searchParams.get('model') || 'openai';

    let voices: any[] = [];

    if (model === 'elevenlabs') {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (apiKey) {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': apiKey },
        });
        if (response.ok) {
          const data = await response.json();
          voices = data.voices;
        }
      }
    } else {
      voices = [
        { id: 'alloy', name: 'Alloy', language: 'en-US' },
        { id: 'nova', name: 'Nova', language: 'en-US' },
        { id: 'echo', name: 'Echo', language: 'en-US' },
        { id: 'fable', name: 'Fable', language: 'en-US' },
        { id: 'onyx', name: 'Onyx', language: 'en-US' },
        { id: 'shimmer', name: 'Shimmer', language: 'en-US' },
      ];
    }

    return NextResponse.json({
      success: true,
      voices,
      model,
    });
  } catch (error) {
    console.error('Voices Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 },
    );
  }
}
