
import { useState, useEffect } from "react";
import { Mic, MicOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/components/ui/use-toast";
import ApiKeyForm from "@/components/ApiKeyForm";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import ConversationHistory from "@/components/ConversationHistory";
import VoiceAssistant from "@/components/VoiceAssistant";
import { ApiKeys, Message } from "@/types/api";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    elevenlabs: "",
    deepgram: "",
    groq: "",
    livekit: ""
  });
  const [conversation, setConversation] = useState<Message[]>([]);
  
  const toggleListening = () => {
    if (!hasAllApiKeys()) {
      toast({
        title: "Missing API Keys",
        description: "Please enter all required API keys in settings",
        variant: "destructive"
      });
      return;
    }
    
    if (isListening) {
      setIsListening(false);
      toast({
        title: "Voice Detection Stopped",
        description: "The assistant is no longer listening"
      });
    } else {
      setIsListening(true);
      toast({
        title: "Voice Detection Started",
        description: "The assistant is now listening"
      });
    }
  };

  const hasAllApiKeys = () => {
    return Object.values(apiKeys).every(key => key.trim() !== "");
  };

  const saveApiKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem("voicebot_api_keys", JSON.stringify(keys));
    toast({
      title: "API Keys Saved",
      description: "Your API keys have been saved successfully"
    });
  };

  const handleTranscriptChange = (newTranscript: string) => {
    setTranscript(newTranscript);
  };

  const handleResponseChange = (newResponse: string) => {
    setResponse(newResponse);
  };

  const handleConversationUpdate = (newConversation: Message[]) => {
    setConversation(newConversation);
  };

  useEffect(() => {
    // Load API keys from localStorage if available
    const savedKeys = localStorage.getItem("voicebot_api_keys");
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error("Failed to parse saved API keys", e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Echo Universe
        </h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>API Configuration</SheetTitle>
            </SheetHeader>
            <ApiKeyForm apiKeys={apiKeys} onSave={saveApiKeys} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center space-y-8">
        <div className="w-full bg-white/40 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-6 flex-1 flex flex-col">
          <ConversationHistory conversation={conversation} />
          
          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <p className="text-gray-500 text-sm flex-1 italic">
                {isListening 
                  ? transcript || "Listening..." 
                  : "Press the microphone button to start speaking"}
              </p>
              {isListening && <VoiceVisualizer />}
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center pb-8">
          <Button
            onClick={toggleListening}
            className={`h-16 w-16 rounded-full ${
              isListening 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-purple-600 hover:bg-purple-700"
            } transition-all duration-300 ease-in-out`}
          >
            {isListening ? (
              <MicOff className="h-8 w-8 text-white" />
            ) : (
              <Mic className="h-8 w-8 text-white" />
            )}
          </Button>
        </div>
      </main>

      {/* Voice Assistant Logic Component */}
      <VoiceAssistant
        apiKeys={apiKeys}
        isListening={isListening}
        onTranscriptChange={handleTranscriptChange}
        onResponseChange={handleResponseChange}
        onConversationUpdate={handleConversationUpdate}
      />
    </div>
  );
};

export default Index;
