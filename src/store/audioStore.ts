import { create } from "zustand";

interface AudioStore {
  currentPlayingId: string;
  setCurrentPlayingId: (id: string) => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  currentPlayingId: "",
  setCurrentPlayingId: (id: string) =>
    set((state) => ({ ...state, currentPlayingId: id })),
}));
