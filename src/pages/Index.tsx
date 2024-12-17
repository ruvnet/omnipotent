import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square } from "lucide-react";
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
          duration: 0
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-rose-50 to-orange-50">
      <Card className="max-w-2xl mx-auto h-[80vh] glass-panel flex flex-col rounded-[2rem] overflow-hidden border-0">
        <div className="p-6 flex-1 space-y-4 overflow-y-auto">
          {messages.map((message) => (
            <AudioMessage key={message.id} message={message} />
          ))}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground/60 text-lg">
              Start recording to send a voice message
            </div>
          )}
        </div>
        
        <div className="p-8 flex justify-center items-center gap-6 border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className={`rounded-full w-16 h-16 p-0 transition-all duration-300 hover:scale-105 ${
              isRecording ? 'bg-red-500 hover:bg-red-600 recording-pulse' : 'bg-primary hover:bg-primary/90'
            }`}
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