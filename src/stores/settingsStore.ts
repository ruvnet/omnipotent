import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceOption = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type ModelOption = 'tts-1' | 'tts-1-hd';

interface SettingsState {
  voice: VoiceOption;
  model: ModelOption;
  prompt: string;
  story: string;
  character: {
    name: string;
    personality: string[];
    background: string;
  };
  setVoice: (voice: VoiceOption) => void;
  setModel: (model: ModelOption) => void;
  setPrompt: (prompt: string) => void;
  setStory: (story: string) => void;
  setCharacter: (character: Partial<SettingsState['character']>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      voice: 'nova',
      model: 'tts-1',
      prompt: "You are a helpful AI assistant named Omnipotent. Respond naturally and warmly.",
      story: "In a world where AI and humans collaborate seamlessly...",
      character: {
        name: "Omnipotent",
        personality: ["Warm", "Helpful", "Knowledgeable"],
        background: "An AI assistant designed to help humans achieve their goals.",
      },
      setVoice: (voice) => set((state) => ({ ...state, voice })),
      setModel: (model) => set((state) => ({ ...state, model })),
      setPrompt: (prompt) => set((state) => ({ ...state, prompt })),
      setStory: (story) => set((state) => ({ ...state, story })),
      setCharacter: (character) => set((state) => ({
        ...state,
        character: { ...state.character, ...character }
      })),
    }),
    {
      name: 'settings-storage',
    }
  )
);