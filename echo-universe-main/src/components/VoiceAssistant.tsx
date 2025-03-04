
import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { ApiKeys, Message } from "@/types/api";
import { processDeepgramAudio } from "@/services/deepgramService";
import { generateElevenLabsVoice } from "@/services/elevenlabsService";
import { sendMessageToGroq } from "@/services/groqService";
import { setupLiveKit } from "@/services/livekitService";
import { toast } from "@/components/ui/use-toast";

interface VoiceAssistantProps {
  apiKeys: ApiKeys;
  isListening: boolean;
  onTranscriptChange: (transcript: string) => void;
  onResponseChange: (response: string) => void;
  onConversationUpdate: (conversation: Message[]) => void;
}

const VoiceAssistant = ({
  apiKeys,
  isListening,
  onTranscriptChange,
  onResponseChange,
  onConversationUpdate
}: VoiceAssistantProps) => {
  const [transcript, setTranscript] = useState("");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [livekitRoom, setLivekitRoom] = useState<any>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processingRef = useRef(false);

  // Setup audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Initialize LiveKit when API keys are available
  useEffect(() => {
    if (apiKeys.livekit && !livekitRoom) {
      const initLiveKit = async () => {
        try {
          const room = await setupLiveKit(apiKeys.livekit);
          console.log("LiveKit room created:", room);
          setLivekitRoom(room);
        } catch (error) {
          console.error("Failed to set up LiveKit:", error);
          toast({
            title: "LiveKit Error",
            description: "Failed to initialize LiveKit room",
            variant: "destructive"
          });
        }
      };
      
      initLiveKit();
    }
    
    return () => {
      if (livekitRoom) {
        livekitRoom.disconnect();
      }
    };
  }, [apiKeys.livekit]);

  // Handle microphone access
  useEffect(() => {
    const getAudioStream = async () => {
      if (isListening && !audioStream) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setAudioStream(stream);
          console.log("Audio stream started");
        } catch (error) {
          console.error("Error accessing microphone:", error);
          toast({
            title: "Microphone Error",
            description: "Failed to access your microphone. Please check permissions.",
            variant: "destructive"
          });
        }
      } else if (!isListening && audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
        setTranscript("");
        onTranscriptChange("");
        console.log("Audio stream stopped");
      }
    };

    getAudioStream();
  }, [isListening, audioStream, onTranscriptChange]);

  // Process audio for transcription when streaming
  useEffect(() => {
    if (!audioStream || !isListening || !apiKeys.deepgram) return;

    let chunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(audioStream);
    
    // Save audio chunks for processing
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Process audio when recording stops
    mediaRecorder.onstop = async () => {
      if (!isListening || processingRef.current) return;
      
      if (chunks.length > 0) {
        processingRef.current = true;
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        try {
          // Transcribe using Deepgram
          const transcription = await processDeepgramAudio(audioBlob, apiKeys.deepgram);
          console.log("Transcription:", transcription);
          
          if (transcription.trim()) {
            setTranscript(transcription);
            onTranscriptChange(transcription);
            
            // Add user message to conversation
            const userMessage: Message = {
              id: uuidv4(),
              role: 'user',
              content: transcription,
              timestamp: Date.now()
            };
            
            const updatedConversation = [...conversation, userMessage];
            setConversation(updatedConversation);
            onConversationUpdate(updatedConversation);
            
            // Get AI response from Groq
            const aiResponse = await sendMessageToGroq(
              updatedConversation,
              apiKeys.groq
            );
            
            if (aiResponse) {
              // Add AI response to conversation
              const assistantMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: aiResponse,
                timestamp: Date.now()
              };
              
              const newConversation = [...updatedConversation, assistantMessage];
              setConversation(newConversation);
              onConversationUpdate(newConversation);
              onResponseChange(aiResponse);
              
              // Generate voice using ElevenLabs
              const audioUrl = await generateElevenLabsVoice(
                aiResponse,
                apiKeys.elevenlabs
              );
              
              if (audioUrl && audioContextRef.current) {
                // Play the generated audio
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start(0);
              }
            }
          }
        } catch (error) {
          console.error("Error in processing voice:", error);
          toast({
            title: "Processing Error",
            description: "An error occurred while processing your voice",
            variant: "destructive"
          });
        } finally {
          processingRef.current = false;
          chunks = [];
        }
      }
    };

    // Start recording in small chunks to analyze speech
    mediaRecorder.start();
    
    const recordingInterval = setInterval(() => {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        mediaRecorder.start();
      }
    }, 3000); // Process every 3 seconds

    return () => {
      clearInterval(recordingInterval);
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    };
  }, [audioStream, isListening, apiKeys, conversation, onTranscriptChange, onResponseChange, onConversationUpdate]);

  return null; // This is a logic-only component
};

export default VoiceAssistant;
