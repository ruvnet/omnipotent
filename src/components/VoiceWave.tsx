import React from 'react';

interface VoiceWaveProps {
  isStreaming?: boolean;
}

export const VoiceWave = ({ isStreaming }: VoiceWaveProps) => {
  return (
    <div className="flex items-center gap-2 h-4 px-2">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`inline-block w-0.5 h-2 bg-current rounded-full ${
            isStreaming ? 'animate-wave-fast' : 'animate-wave'
          }`}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};