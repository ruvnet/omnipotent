import React from 'react';

export const VoiceWave = () => {
  return (
    <div className="voice-wave">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          style={{
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};