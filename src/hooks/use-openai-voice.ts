import { useRef, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/stores/settingsStore';
import { createVoicePrompt, formatVoiceResponse, VOICE_SYSTEM_PROMPT } from '@/lib/voice-prompt';

interface UseOpenAIVoiceProps {
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: string) => void;
  onTranscription?: (text: string) => void;
}

export function useOpenAIVoice({ 
  onStreamStart, 
  onStreamEnd, 
  onError,
  onTranscription 
}: UseOpenAIVoiceProps = {}) {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const { toast } = useToast();
  const { voice, model } = useSettings();
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);

  // Handle incoming transcription from OpenAI
  const handleTranscription = (text: string) => {
    setTranscription(text);
    onTranscription?.(text);
    
    // Add user message to conversation history
    const userMessage = { role: 'user', content: text };
    setConversationHistory(prev => [...prev, userMessage]);
  };

  // Process response using our voice prompt system
  const processResponse = async (text: string) => {
    const prompt = createVoicePrompt(text, conversationHistory);
    const response = formatVoiceResponse(text);
    
    // Add assistant response to conversation history
    const assistantMessage = { role: 'assistant', content: response };
    setConversationHistory(prev => [...prev, assistantMessage]);
    
    return response;
  };

  const initialize = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      const message = 'OpenAI API key not found in environment variables';
      toast({
        title: "Configuration Error",
        description: message,
        variant: "destructive",
      });
      onError?.(message);
      return;
    }

    try {
      // Create a new WebRTC PeerConnection
      peerConnection.current = new RTCPeerConnection();

      // Create data channel for transcriptions and responses
      dataChannel.current = peerConnection.current.createDataChannel('transcription');
      dataChannel.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcription') {
          handleTranscription(data.text);
          // Process response using our prompt system
          const response = await processResponse(data.text);
          // Send response back through data channel
          dataChannel.current?.send(JSON.stringify({ 
            type: 'response',
            text: response 
          }));
        }
      };

      // Handle incoming audio stream
      peerConnection.current.ontrack = (e) => {
        const audioElement = document.createElement('audio');
        audioElement.srcObject = e.streams[0];
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
        setIsStreaming(true);
        onStreamStart?.();
      };

      try {
        // Get microphone access and add track to peer connection
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        peerConnection.current.addTrack(localStream.getTracks()[0]);
      } catch (err) {
        throw new Error(`Microphone error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Create and set local description
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      try {
        const resp = await fetch('https://api.openai.com/v1/realtime', {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/sdp',
            'X-OpenAI-Voice': voice,
            'X-OpenAI-Model': model,
            'X-OpenAI-Assistant-Context': JSON.stringify({
              prompt: VOICE_SYSTEM_PROMPT.content,
              conversation_history: conversationHistory
            })
          }
        });

        if (!resp.ok) {
          throw new Error(`API error: ${resp.status} ${resp.statusText}`);
        }

        // Set remote description from OpenAI's answer
        await peerConnection.current.setRemoteDescription({
          type: 'answer',
          sdp: await resp.text()
        });

        setIsConnected(true);
      } catch (err) {
        throw new Error(`API error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize voice connection';
      toast({
        title: "Connection Error",
        description: message,
        variant: "destructive",
      });
      onError?.(message);
      disconnect();
    }
  };

  const disconnect = () => {
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
      setIsConnected(false);
      setIsStreaming(false);
      onStreamEnd?.();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isStreaming,
    transcription,
    initialize,
    disconnect,
    conversationHistory
  };
}