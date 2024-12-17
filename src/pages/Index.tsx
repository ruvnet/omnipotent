import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Square, MessageSquare, Menu } from "lucide-react";
import { VoiceWave } from '@/components/VoiceWave';
import { AudioMessage } from '@/components/AudioMessage';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOpenAIVoice } from '@/hooks/use-openai-voice';
import { SettingsModal } from '@/components/SettingsModal';
import { AboutModal } from '@/components/AboutModal';
import { VoiceMessage } from '@/types/voice';
import "@fontsource/space-grotesk";

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { toast } = useToast();

  const handleMessageReceived = (message: VoiceMessage) => {
    console.log('Message received:', message);
    setMessages(prev => [...prev, message]);
  };

  const { initialize, disconnect, isConnected, isStreaming } = useOpenAIVoice({
    onStreamStart: () => {
      toast({
        title: "Connected to OpenAI",
        description: "Voice streaming has started",
      });
    },
    onStreamEnd: () => {
      toast({
        title: "Disconnected",
        description: "Voice streaming has ended",
      });
      setIsRecording(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      setIsRecording(false);
    },
    onMessageReceived: handleMessageReceived
  });

  const startRecording = async () => {
    try {
      await initialize();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    disconnect();
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-rose-50 to-orange-50">
      <div className="flex justify-between items-center mb-8 max-w-2xl mx-auto">
        <div className="flex-1" />
        <div className="flex flex-col items-center">
          <MessageSquare className="w-8 h-8 text-primary mb-2" />
          <h1 className="text-2xl font-semibold text-primary/90 font-space-grotesk">Omnipotent</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAboutOpen(true)}>
                About
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card className="max-w-2xl mx-auto h-[80vh] glass-panel flex flex-col rounded-[2rem] overflow-hidden border-0">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <AudioMessage key={message.id} message={message} />
            ))}
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground/60 text-lg font-space-grotesk">
                Start recording to send a voice message
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-8 flex justify-center items-center gap-6 border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className={`rounded-full w-16 h-16 p-0 transition-all duration-300 hover:scale-105 ${
              isRecording ? 'bg-red-500 hover:bg-red-600 recording-pulse' : 'bg-primary hover:bg-primary/90'
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isConnected && isRecording}
          >
            {isRecording ? (
              <Square className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          {isRecording && <VoiceWave isStreaming={isStreaming} />}
          {isConnected && (
            <div className="text-sm text-muted-foreground">
              {isStreaming ? 'Streaming...' : 'Connected'}
            </div>
          )}
        </div>
      </Card>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
};

export default Index;