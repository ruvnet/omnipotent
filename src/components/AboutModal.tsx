import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/stores/settingsStore";
import { Badge } from "@/components/ui/badge";

export function AboutModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { character, story } = useSettings();

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
          <DialogTitle>About Omnipotent</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="character" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="character">Character</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
          </TabsList>
          
          <TabsContent value="character" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Name</h3>
                <p className="text-muted-foreground">{character.name}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Personality Traits</h3>
                <div className="flex flex-wrap gap-2">
                  {character.personality.map((trait, index) => (
                    <Badge key={index} variant="secondary">{trait}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Background</h3>
                <p className="text-muted-foreground">{character.background}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="story" className="space-y-4">
            <p className="text-muted-foreground whitespace-pre-line">
              {story}
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}