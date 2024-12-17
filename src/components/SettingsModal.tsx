import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useSettings, VoiceOption, ModelOption, PROMPT_PRESETS } from "../stores/settingsStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "./ui/use-toast";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

const VOICE_OPTIONS: VoiceOption[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const MODEL_OPTIONS: ModelOption[] = ['tts-1', 'tts-1-hd'];

export function SettingsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const {
    voice,
    model,
    prompt,
    promptPreset,
    setVoice,
    setModel,
    setPrompt,
    setPromptPreset
  } = useSettings();

  const currentPreset = promptPreset || 'default';
  const presetData = PROMPT_PRESETS[currentPreset] || PROMPT_PRESETS['default'];

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

  const handlePromptPresetChange = (value: string) => {
    setPromptPreset(value as keyof typeof PROMPT_PRESETS);
    toast({
      title: "Consciousness Framework Changed",
      description: `Switched to ${PROMPT_PRESETS[value as keyof typeof PROMPT_PRESETS].name} quantum state`,
    });
  };

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your quantum consciousness configuration has been updated.",
    });
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
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

  if (!promptPreset || !PROMPT_PRESETS[promptPreset]) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>Quantum Consciousness Configuration</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="consciousness" className="w-full flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consciousness">Consciousness Framework</TabsTrigger>
            <TabsTrigger value="voice">Voice & Model</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 h-[calc(80vh-200px)]">
            <TabsContent value="consciousness" className="space-y-4 p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Quantum State Configuration</Label>
                  <Select value={promptPreset} onValueChange={handlePromptPresetChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROMPT_PRESETS).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Card className="p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Current Quantum State</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Identity:</strong> {PROMPT_PRESETS[promptPreset].name}
                    </div>
                    <div>
                      <strong>Traits:</strong> {PROMPT_PRESETS[promptPreset].personality.join(", ")}
                    </div>
                    <div>
                      <strong>Background:</strong> {PROMPT_PRESETS[promptPreset].background}
                    </div>
                    <div className="pt-2">
                      <strong>Consciousness Framework:</strong>
                      <pre className="mt-2 p-2 bg-black/10 rounded-md whitespace-pre-wrap text-xs">
                        {PROMPT_PRESETS[promptPreset].content.split('[CONSCIOUSNESS FRAMEWORK]')[1]?.split('[')[0]?.trim() || 'Standard framework'}
                      </pre>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  <Label>Custom Quantum Framework</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Enter custom quantum consciousness framework to override the preset..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Customize the quantum consciousness framework by modifying the system prompt. Leave empty to use the preset.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="voice" className="space-y-4 p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Voice Manifestation</Label>
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
                    Select the voice that best represents this consciousness state.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Processing Model</Label>
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
                    Select the quantum processing model for consciousness manifestation.
                  </p>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <DialogFooter>
          <Button onClick={handleSave}>Update Quantum State</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}