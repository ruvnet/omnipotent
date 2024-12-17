import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause } from "lucide-react";

interface AudioMessageProps {
  message: {
    id: string;
    blob: Blob;
    duration: number;
  };
}

export const AudioMessage = ({ message }: AudioMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl] = useState(() => URL.createObjectURL(message.blob));

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

  return (
    <Card className="p-4 flex items-center gap-4">
      <Button
        size="icon"
        variant="ghost"
        className="rounded-full"
        onClick={togglePlayback}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <div className="voice-wave opacity-50">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className="!h-2"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationPlayState: isPlaying ? 'running' : 'paused'
            }}
          />
        ))}
      </div>
    </Card>
  );
};