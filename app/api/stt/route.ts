import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/firebaseAuth';

interface STTRequestBody {
  audio: string;
  language?: string;
  provider?: 'openai' | 'google' | 'deepgram';
}
async function transcribeWithOpenAI(
  audioBuffer: Buffer,
  language: string = 'en',
): Promise<{ text: string; confidence: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const formData = new FormData();
  formData.append(
    'file',
    new Blob(
      [
        audioBuffer.buffer.slice(
          audioBuffer.byteOffset,
          audioBuffer.byteOffset + audioBuffer.byteLength,
        ) as any,
      ],
      { type: 'audio/mp3' },
    ),
    'audio.mp3',
  );
  formData.append('model', 'whisper-1');
  formData.append('language', language);

  const response = await fetch(
    'https://api.openai.com/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.text,
    confidence: 0.95,
  };
}

async function transcribeWithGoogle(
  audioBuffer: Buffer,
  language: string = 'en-US',
): Promise<{ text: string; confidence: number }> {
  const apiKey = process.env.GOOGLE_CLOUD_STT_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_STT_KEY not configured');
  }

  const audioContent = audioBuffer.toString('base64');

  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'LINEAR16',
          languageCode: language,
          maxAlternatives: 1,
        },
        audio: {
          content: audioContent,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Cloud STT error: ${error}`);
  }

  const data = await response.json();
  const result = data.results?.[0];

  if (!result) {
    return { text: '', confidence: 0 };
  }

  const transcript = result.alternatives?.[0];
  return {
    text: transcript?.transcript || '',
    confidence: transcript?.confidence || 0.5,
  };
}

async function transcribeWithDeepgram(
  audioBuffer: Buffer,
  language: string = 'en',
): Promise<{ text: string; confidence: number }> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  const response = await fetch('https://api.deepgram.com/v1/listen', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'audio/mp3',
    },
    body: audioBuffer.buffer.slice(
      audioBuffer.byteOffset,
      audioBuffer.byteOffset + audioBuffer.byteLength,
    ) as any,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram API error: ${error}`);
  }

  const data = await response.json();
  const transcript = data.results?.channels?.[0]?.alternatives?.[0];

  if (!transcript) {
    return { text: '', confidence: 0 };
  }

  return {
    text: transcript.transcript || '',
    confidence: transcript.confidence || 0.5,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      audio,
      language = 'en',
      provider = 'openai',
    }: STTRequestBody = await req.json();

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 },
      );
    }

    const audioBuffer = Buffer.from(audio, 'base64');

    let result: { text: string; confidence: number };

    switch (provider) {
      case 'google':
        result = await transcribeWithGoogle(audioBuffer, language);
        break;
      case 'deepgram':
        result = await transcribeWithDeepgram(audioBuffer, language);
        break;
      case 'openai':
      default:
        result = await transcribeWithOpenAI(audioBuffer, language);
        break;
    }

    return NextResponse.json({
      success: true,
      transcript: result.text,
      confidence: result.confidence,
      provider,
    });
  } catch (error) {
    console.error('STT Error:', error);
    return NextResponse.json(
      { error: `Transcription failed: ${String(error)}` },
      { status: 500 },
    );
  }
}
