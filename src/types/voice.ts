export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  blob: Blob;
  duration: number;
  timestamp: number;
}

export interface VoiceEventHandlers {
  onSpeechStart?: () => void;
  onSpeechStop?: () => void;
  onError?: (error: string) => void;
}

export interface UseOpenAIVoiceProps {
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: string) => void;
  onMessageReceived?: (message: VoiceMessage) => void;
}