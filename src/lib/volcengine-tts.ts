export interface WordTimestamp {
  word: string;
  startTime: number; // seconds
  endTime: number;   // seconds
  confidence?: number;
}

export interface TimestampEntry {
  text: string;
  start_time: number; // ms (converted from seconds)
  end_time: number;   // ms
}

export interface TTSResult {
  audioBuffer: ArrayBuffer;
  timestamps: TimestampEntry[];
}

interface TTSOptions {
  text: string;
  speaker?: string;
}

// Exponential backoff configuration (C6 fix)
const POLL_INITIAL_DELAY_MS = 300;
const POLL_MAX_DELAY_MS = 3000;
const POLL_BACKOFF_FACTOR = 1.5;
const POLL_MAX_ATTEMPTS = 20;
const AUDIO_DOWNLOAD_TIMEOUT_MS = 15000;

export async function synthesizeSpeech(options: TTSOptions): Promise<TTSResult> {
  const { text, speaker } = options;
  const apiKey = process.env.VOLCENGINE_TTS_API_KEY!;
  const resourceId = process.env.VOLCENGINE_TTS_RESOURCE_ID || "volc.service_type.10029";
  const defaultSpeaker = process.env.VOLCENGINE_TTS_SPEAKER!;

  // Step 1: Submit TTS task (async API with timestamp support)
  const submitBody = {
    user: { uid: "hk-office-learning" },
    namespace: "BidirectionalTTS",
    req_params: {
      text,
      speaker: speaker || defaultSpeaker,
      audio_params: {
        format: "mp3",
        sample_rate: 24000,
        enable_timestamp: true,
      },
      additions: JSON.stringify({
        disable_markdown_filter: true,
        enable_language_detector: true,
        enable_latex_tn: true,
        disable_default_bit_rate: true,
        max_length_to_filter_parenthesis: 0,
      }),
    },
  };

  const submitResp = await fetch(
    "https://openspeech.bytedance.com/api/v3/tts/submit",
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "X-Api-Resource-Id": resourceId,
        "X-Api-Request-Id": randomUUID(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitBody),
    },
  );

  if (!submitResp.ok) {
    const err = await submitResp.text();
    throw new Error(`Volcengine submit error: ${submitResp.status} ${err}`);
  }

  const submitData = await submitResp.json();
  if (submitData.code && submitData.code !== 0 && submitData.code !== 20000000) {
    throw new Error(`Volcengine submit error: code=${submitData.code} message=${submitData.message}`);
  }

  const taskId = submitData.data?.task_id || submitData.task_id;
  if (!taskId) {
    throw new Error("No task_id in Volcengine submit response");
  }

  // Step 2: Poll for completion with exponential backoff (C6 fix)
  const queryBody = {
    task_id: taskId,
  };

  let attempts = 0;
  let delay = POLL_INITIAL_DELAY_MS;

  while (attempts < POLL_MAX_ATTEMPTS) {
    await sleep(delay);
    attempts++;

    const queryResp = await fetch(
      "https://openspeech.bytedance.com/api/v3/tts/query",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "X-Api-Resource-Id": resourceId,
          "X-Api-Request-Id": randomUUID(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryBody),
      },
    );

    if (!queryResp.ok) {
      const err = await queryResp.text();
      throw new Error(`Volcengine query error: ${queryResp.status} ${err}`);
    }

    const queryData = await queryResp.json();

    // task_status: 1=pending, 2=success, 3=failed
    const status = queryData.data?.task_status ?? queryData.task_status;

    if (status === 3) {
      throw new Error("Volcengine TTS task failed");
    }

    if (status === 2) {
      // Success! Extract timestamps and download audio
      const resultData = queryData.data || queryData;

      // Parse timestamps from sentences[].words[]
      const timestamps = parseTimestampsFromSentences(resultData.sentences || []);

      // Download audio from URL
      const audioUrl = resultData.audio_url || resultData.audioUrl;
      if (!audioUrl) {
        throw new Error("No audio_url in Volcengine response");
      }

      // Add timeout to audio download (C6 fix)
      const ac = new AbortController();
      const timeoutId = setTimeout(() => ac.abort(), AUDIO_DOWNLOAD_TIMEOUT_MS);
      try {
        const audioResp = await fetch(audioUrl, { signal: ac.signal });
        if (!audioResp.ok) {
          throw new Error(`Failed to download audio: ${audioResp.status}`);
        }
        const audioBuffer = await audioResp.arrayBuffer();
        return { audioBuffer, timestamps };
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // Exponential backoff with cap
    delay = Math.min(delay * POLL_BACKOFF_FACTOR, POLL_MAX_DELAY_MS);
  }

  throw new Error(`Volcengine TTS timed out after ${POLL_MAX_ATTEMPTS} attempts (${(POLL_MAX_ATTEMPTS * POLL_MAX_DELAY_MS) / 1000}s max)`);
}

function parseTimestampsFromSentences(
  sentences: Array<{
    words?: Array<WordTimestamp>;
    text?: string;
  }>,
): TimestampEntry[] {
  const result: TimestampEntry[] = [];

  for (const sentence of sentences) {
    if (sentence.words && Array.isArray(sentence.words)) {
      for (const w of sentence.words) {
        result.push({
          text: w.word,
          start_time: Math.round(w.startTime * 1000),
          end_time: Math.round(w.endTime * 1000),
        });
      }
    }
  }

  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomUUID(): string {
  return crypto.randomUUID?.() ??
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}
