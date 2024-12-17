import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSettings, VoiceOption, ModelOption } from "@/stores/settingsStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

const VOICE_OPTIONS: VoiceOption[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const MODEL_OPTIONS: ModelOption[] = ['tts-1', 'tts-1-hd'];

export function SettingsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { voice, model, prompt, setVoice, setModel, setPrompt } = useSettings();

  const handleVoiceChange = (value: string) => {
    setVoice(value as VoiceOption);
    toast({
      title: "Voice Changed",
      description: "Reconnecting with new voice settings...",
    });
  };

  const handleModelChange = (value: string) => {
    setModel(value as ModelOption);
    toast({
      title: "Model Changed",
      description: "Reconnecting with new model settings...",
    });
  };

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    });
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    // Ensure any lingering overlay elements are removed
    if (!newOpen) {
      setTimeout(() => {
        const overlays = document.querySelectorAll('[role="presentation"]');
        overlays.forEach(overlay => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        });
      }, 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voice">Voice & Model</TabsTrigger>
            <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          </TabsList>
          
          <TabsContent value="voice" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={voice} onValueChange={handleVoiceChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Changing the voice will reconnect the streaming session.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={model} onValueChange={handleModelChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Changing the model will reconnect the streaming session.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="prompt" className="space-y-4">
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px]"
                placeholder="Enter the system prompt that defines the AI's behavior..."
              />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}