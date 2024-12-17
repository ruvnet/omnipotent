import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Play, Pause } from "lucide-react";
import { VoiceWave } from '@/components/VoiceWave';
import { AudioMessage } from '@/components/AudioMessage';
import { useToast } from '@/components/ui/use-toast';

interface AudioMessage {
  id: string;
  blob: Blob;
  duration: number;
}

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          blob,
          duration: 0 // You could calculate actual duration if needed
        }]);
        chunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to record audio messages.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col max-w-2xl mx-auto">
      <Card className="p-6 glass-panel flex-1 flex flex-col">
        <div className="flex-1 space-y-4 mb-4">
          {messages.map((message) => (
            <AudioMessage key={message.id} message={message} />
          ))}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Start recording to send a voice message
            </div>
          )}
        </div>
        
        <div className="flex justify-center items-center gap-4">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className={`rounded-full w-16 h-16 p-0 ${isRecording ? 'recording-pulse' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <Square className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          {isRecording && <VoiceWave />}
        </div>
      </Card>
    </div>
  );
};

export default Index;