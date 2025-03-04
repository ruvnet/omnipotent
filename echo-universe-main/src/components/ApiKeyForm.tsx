
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiKeys } from "@/types/api";

interface ApiKeyFormProps {
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

const ApiKeyForm = ({ apiKeys, onSave }: ApiKeyFormProps) => {
  const [formKeys, setFormKeys] = useState<ApiKeys>(apiKeys);

  useEffect(() => {
    setFormKeys(apiKeys);
  }, [apiKeys]);

  const handleChange = (key: keyof ApiKeys, value: string) => {
    setFormKeys(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formKeys);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="elevenlabs">ElevenLabs API Key</Label>
          <Input
            id="elevenlabs"
            type="password"
            value={formKeys.elevenlabs}
            onChange={(e) => handleChange("elevenlabs", e.target.value)}
            placeholder="Enter your ElevenLabs API key"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="deepgram">Deepgram API Key</Label>
          <Input
            id="deepgram"
            type="password"
            value={formKeys.deepgram}
            onChange={(e) => handleChange("deepgram", e.target.value)}
            placeholder="Enter your Deepgram API key"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="groq">Groq API Key</Label>
          <Input
            id="groq"
            type="password"
            value={formKeys.groq}
            onChange={(e) => handleChange("groq", e.target.value)}
            placeholder="Enter your Groq API key"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="livekit">LiveKit API Key</Label>
          <Input
            id="livekit"
            type="password"
            value={formKeys.livekit}
            onChange={(e) => handleChange("livekit", e.target.value)}
            placeholder="Enter your LiveKit API key"
            className="mt-1"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">Save API Keys</Button>
    </form>
  );
};

export default ApiKeyForm;
