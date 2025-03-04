import { useRef, useEffect, useState } from 'react';
import { useToast } from "../components/ui/use-toast";
import { useSettings } from "../stores/settingsStore";
import { VOICE_SYSTEM_PROMPT } from "../lib/voice-prompt";
import { logWebRTCStats, runAudioDiagnostic } from "../lib/audio-debug";

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
  const [diagnosticRun, setDiagnosticRun] = useState(false);
  const statsIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();
  const { voice, model } = useSettings();
  
  // Run audio diagnostics when there's an issue
  const runDiagnostics = async () => {
    if (diagnosticRun) return; // Only run once per session
    
    setDiagnosticRun(true);
    console.log('🔍 Running audio diagnostics...');
    
    try {
      const results = await runAudioDiagnostic();
      
      if (results.issues.length > 0) {
        console.warn('⚠️ Audio diagnostic issues detected:');
        results.issues.forEach(issue => console.warn(`- ${issue}`));
        
        toast({
          title: "Audio Issues Detected",
          description: results.issues[0],
          variant: "destructive",
        });
      }
      
      // Log WebRTC stats if connection exists
      if (peerConnection.current) {
        await logWebRTCStats(peerConnection.current);
      }
    } catch (error) {
      console.error('Error running audio diagnostics:', error);
    }
  };

  // Define types for WebRTC message events
  interface ServerEventData {
    type: string;
    message?: string;
    [key: string]: unknown;
  }

  // Handle incoming server events
  const handleServerEvent = (event: MessageEvent) => {
    const data = JSON.parse(event.data) as ServerEventData;
    let errorMessage: string;
    
    switch (data.type) {
      case 'session.created':
        console.log('Session created:', data);
        // Send session update with voice prompt configuration
        if (dataChannel.current) {
          dataChannel.current.send(JSON.stringify({
            type: 'session.update',
            session: {
              instructions: VOICE_SYSTEM_PROMPT.content
            }
          }));
        }
        break;

      case 'session.updated':
        console.log('Session updated:', data);
        break;

      case 'input_audio_buffer.speech_started':
        setIsStreaming(true);
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsStreaming(false);
        break;

      case 'error':
        errorMessage = data.message || 'An error occurred';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        onError?.(errorMessage);
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
      // Create a new WebRTC PeerConnection with STUN/TURN servers to help with NAT traversal
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      });
      
      // Log ICE candidate gathering
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 New ICE candidate:', event.candidate.candidate);
        } else {
          console.log('🧊 ICE candidate gathering complete');
        }
      };

      // Create data channel for events
      dataChannel.current = peerConnection.current.createDataChannel('events');
      dataChannel.current.onmessage = handleServerEvent;

      // Handle incoming audio stream
      peerConnection.current.ontrack = (e) => {
        console.log('🎵 Audio track received:', e.streams);
        
        if (!e.streams || e.streams.length === 0) {
          console.error('❌ No audio streams received from OpenAI');
          return;
        }
        
        const audioStream = e.streams[0];
        if (!audioStream.active) {
          console.warn('⚠️ Audio stream is not active');
        }
        
        // Create and configure audio element
        const audioElement = document.createElement('audio');
        audioElement.srcObject = audioStream;
        audioElement.autoplay = true;
        audioElement.id = 'openai-voice-audio';
        
        // Add event listeners for debugging
        audioElement.onplay = () => console.log('▶️ Audio playback started');
        audioElement.onpause = () => console.log('⏸️ Audio playback paused');
        audioElement.onended = () => console.log('⏹️ Audio playback ended');
        audioElement.onerror = (err) => console.error('❌ Audio playback error:', err);
        
        // Try to play the audio
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Audio is playing successfully');
              
              // Set up periodic WebRTC stats logging
              if (statsIntervalRef.current === null) {
                statsIntervalRef.current = window.setInterval(() => {
                  if (peerConnection.current) {
                    logWebRTCStats(peerConnection.current).catch(console.error);
                  }
                }, 10000); // Log stats every 10 seconds
              }
            })
            .catch(err => {
              console.error('❌ Audio playback failed:', err);
              toast({
                title: "Audio Playback Error",
                description: `Failed to play audio: ${err.message}`,
                variant: "destructive",
              });
              
              // Run diagnostics when audio playback fails
              runDiagnostics().catch(console.error);
            });
        }
        
        // Append to document body
        document.body.appendChild(audioElement);
        console.log('🔊 Audio element added to DOM:', audioElement);
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

  // Add WebRTC connection event handlers
  useEffect(() => {
    if (!peerConnection.current) return;
    
    const pc = peerConnection.current;
    
    // Connection state change handler
    const handleConnectionStateChange = () => {
      console.log(`WebRTC connection state changed: ${pc.connectionState}`);
      
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.error('❌ WebRTC connection failed or disconnected');
        runDiagnostics().catch(console.error);
      }
    };
    
    // ICE connection state change handler
    const handleIceConnectionStateChange = () => {
      console.log(`ICE connection state changed: ${pc.iceConnectionState}`);
      
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.error('❌ ICE connection failed or disconnected');
        runDiagnostics().catch(console.error);
      }
    };
    
    // Add event listeners
    pc.addEventListener('connectionstatechange', handleConnectionStateChange);
    pc.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
    
    // Cleanup
    return () => {
      pc.removeEventListener('connectionstatechange', handleConnectionStateChange);
      pc.removeEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
    };
  }, [peerConnection.current]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear stats logging interval
      if (statsIntervalRef.current !== null) {
        window.clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
      
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isStreaming,
    initialize,
    disconnect,
    runDiagnostics // Expose diagnostics function
  };
}
