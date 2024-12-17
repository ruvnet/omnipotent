import { useRef, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/stores/settingsStore';
import { formatVoiceResponse } from '@/lib/voice-prompt';

interface UseOpenAIVoiceProps {
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: string) => void;
}

export function useOpenAIVoice({ onStreamStart, onStreamEnd, onError }: UseOpenAIVoiceProps = {}) {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const { toast } = useToast();
  const { voice, model, prompt } = useSettings();
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);

  // Update conversation history when prompt changes
  useEffect(() => {
    setConversationHistory([{ role: 'system', content: prompt }]);
    console.log('Prompt updated, new conversation history:', [{ role: 'system', content: prompt }]);
  }, [prompt]);

  // Handle incoming transcription from OpenAI
  const handleTranscription = (text: string) => {
    setTranscription(text);
    processResponse(text);
  };

  // Process response using our voice prompt system
  const processResponse = async (text: string) => {
    const response = formatVoiceResponse(text);
    
    // Add assistant response to conversation history
    setConversationHistory(prev => [
      ...prev,
      { role: 'assistant', content: response }
    ]);

    // Log the updated conversation history
    console.log('Updated conversation history:', conversationHistory);
  };

  // Handle incoming server events
  const handleServerEvent = (event: any) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'session.created':
        console.log('Session created:', data);
        // Send session update with current prompt
        if (dataChannel.current) {
          dataChannel.current.send(JSON.stringify({
            type: 'session.update',
            session: {
              instructions: prompt
            }
          }));
        }
        break;

      case 'session.updated':
        console.log('Session updated:', data);
        break;

      case 'transcription':
        handleTranscription(data.text);
        break;

      case 'input_audio_buffer.speech_started':
        setIsStreaming(true);
        onStreamStart?.();
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsStreaming(false);
        onStreamEnd?.();
        break;

      case 'error':
        const message = data.message || 'An error occurred';
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        onError?.(message);
        break;
    }
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

      // Create data channel for events
      dataChannel.current = peerConnection.current.createDataChannel('events');
      dataChannel.current.onmessage = handleServerEvent;

      // Handle incoming audio stream
      peerConnection.current.ontrack = (e) => {
        const audioElement = document.createElement('audio');
        audioElement.srcObject = e.streams[0];
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
      };

      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        peerConnection.current.addTrack(localStream.getTracks()[0]);
      } catch (err) {
        throw new Error(`Microphone error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Create and set local description
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      try {
        const currentVoice = voice || 'nova';
        const currentModel = model || 'tts-1';
        
        console.log('Using voice:', currentVoice);
        console.log('Using prompt:', prompt);
        console.log('Conversation history:', conversationHistory);

        const resp = await fetch('https://api.openai.com/v1/realtime', {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/sdp',
            'OpenAI-Beta': 'realtime-speech',
            'X-Voice': currentVoice,
            'X-Model': currentModel
          }
        });

        if (!resp.ok) {
          throw new Error(`API error: ${resp.status} ${resp.statusText}`);
        }

        await peerConnection.current.setRemoteDescription({
          type: 'answer',
          sdp: await resp.text()
        });

        setIsConnected(true);
        toast({
          title: "Connected to OpenAI",
          description: "Voice streaming is ready",
        });
        onStreamStart?.();
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
      if (isConnected) {
        setIsConnected(false);
        setIsStreaming(false);
        toast({
          title: "Disconnected",
          description: "Voice streaming has ended",
        });
        onStreamEnd?.();
      }
    }
  };

  // Handle voice/model/prompt changes
  useEffect(() => {
    if (isConnected) {
      disconnect();
      setTimeout(() => {
        initialize();
      }, 1000);
    }
  }, [voice, model, prompt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isStreaming,
    initialize,
    disconnect,
    transcription
  };
}