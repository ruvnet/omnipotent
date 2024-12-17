import { useRef, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/stores/settingsStore';
import { VOICE_SYSTEM_PROMPT } from '@/lib/voice-prompt';
import { VoiceMessage, UseOpenAIVoiceProps } from '@/types/voice';

export function useOpenAIVoice({ 
  onStreamStart, 
  onStreamEnd, 
  onError,
  onMessageReceived 
}: UseOpenAIVoiceProps = {}) {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  const { voice, model } = useSettings();

  // Handle incoming server events
  const handleServerEvent = (event: any) => {
    const data = JSON.parse(event.data);
    console.log('Received server event:', data.type);
    
    switch (data.type) {
      case 'session.created':
        console.log('Session created:', data);
        if (dataChannel.current) {
          dataChannel.current.send(JSON.stringify({
            type: 'session.update',
            session: {
              instructions: VOICE_SYSTEM_PROMPT.content
            }
          }));
        }
        break;

      case 'input_audio_buffer.speech_started':
        setIsStreaming(true);
        if (data.audio) {
          console.log('Creating user audio message');
          const message: VoiceMessage = {
            id: crypto.randomUUID(),
            type: 'user',
            blob: new Blob([data.audio], { type: 'audio/mp3' }),
            duration: data.duration || 0,
            timestamp: Date.now()
          };
          onMessageReceived?.(message);
        }
        break;

      case 'assistant.response':
        if (data.audio) {
          console.log('Creating assistant audio message');
          const message: VoiceMessage = {
            id: crypto.randomUUID(),
            type: 'assistant',
            blob: new Blob([data.audio], { type: 'audio/mp3' }),
            duration: data.duration || 0,
            timestamp: Date.now()
          };
          onMessageReceived?.(message);
        }
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
    if (isStreaming) {
      disconnect();
      return;
    }

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
            'OpenAI-Beta': 'realtime-speech',
            'X-Voice': voice || 'nova',
            'X-Model': model || 'tts-1'
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
        setIsStreaming(true);
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
      setIsConnected(false);
      setIsStreaming(false);
      toast({
        title: "Disconnected",
        description: "Voice streaming has ended",
      });
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
    initialize,
    disconnect
  };
}
