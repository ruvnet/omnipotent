
export interface ApiKeys {
  elevenlabs: string;
  deepgram: string;
  groq: string;
  livekit: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}
