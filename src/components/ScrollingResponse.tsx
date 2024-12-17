import React from 'react';
import { cn } from "@/lib/utils";

interface ScrollingResponseProps {
  text: string;
  isVisible: boolean;
}

export const ScrollingResponse = ({ text, isVisible }: ScrollingResponseProps) => {
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center pointer-events-none",
      isVisible ? "opacity-100" : "opacity-0",
      "transition-opacity duration-500"
    )}>
      <div className="max-w-xl w-full h-[40vh] overflow-hidden">
        <div className={cn(
          "bg-black/80 p-6 text-center",
          "text-white font-space-grotesk text-lg leading-relaxed"
        )}>
          <div className="whitespace-pre-wrap">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
};