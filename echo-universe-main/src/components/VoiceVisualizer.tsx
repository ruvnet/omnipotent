
import { useEffect, useRef, useState } from "react";

const VoiceVisualizer = () => {
  const [bars, setBars] = useState<number[]>(Array(12).fill(5));
  const intervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Simple animation to simulate audio visualization
    intervalRef.current = window.setInterval(() => {
      setBars(prev => 
        prev.map(() => Math.max(5, Math.floor(Math.random() * 30)))
      );
    }, 100);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return (
    <div className="flex items-center h-8 space-x-1">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-1 bg-purple-500 rounded-full animate-pulse"
          style={{ 
            height: `${height}px`,
            animationDelay: `${i * 0.05}s` 
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
