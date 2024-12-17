import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2, User, Bot } from "lucide-react";
import { VoiceMessage } from '@/types/voice';
import { formatDistanceToNow } from 'date-fns';

interface AudioMessageProps {
  message: VoiceMessage;
}

export const AudioMessage = ({ message }: AudioMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(message.blob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [message.blob]);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`flex ${message.type === 'assistant' ? 'justify-start' : 'justify-end'} mb-4`}>
      <Card className={`p-4 flex items-center gap-4 max-w-[80%] ${
        message.type === 'assistant' 
          ? 'bg-primary/10 border-0 backdrop-blur-sm rounded-2xl rounded-tl-none' 
          : 'bg-white/40 border-0 backdrop-blur-sm rounded-2xl rounded-tr-none'
      }`}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
          {message.type === 'assistant' ? (
            <Bot className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="rounded-full hover:bg-primary/10 transition-colors relative"
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-primary" />
          ) : (
            <Play className="h-4 w-4 text-primary" />
          )}
        </Button>

        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleEnded}
          className="hidden"
        />

        <div className="flex-1 flex items-center gap-2">
          <div className="voice-wave opacity-50">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="!h-2 bg-primary"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationPlayState: isPlaying ? 'running' : 'paused'
                }}
              />
            ))}
          </div>
          <Volume2 className="h-4 w-4 text-primary/50" />
        </div>
        
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </Card>
    </div>
  );
};