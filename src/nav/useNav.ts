import { create } from "zustand";
import type { Playlist } from "../types";

// Every screen the content area can show. Screens that need data carry it, so
// TypeScript only allows `view.playlist` once `view.name === "playlist"` is checked.
export type View = { name: "grid" } | { name: "playlist"; playlist: Playlist } | { name: "devices" };

type NavState = {
    history: View[];
    go: (view: View) => void;
    back: () => void;
};

// A stack instead of a single "current screen", so Back always returns to
// wherever you came from without each screen having to know.
export const useNav = create<NavState>((set) => ({
    history: [{ name: "grid" }],
    go: (view) => set((s) => ({ history: [...s.history, view] })),
    // the grid is never popped, so there's always a screen to show
    back: () => set((s) => (s.history.length > 1 ? { history: s.history.slice(0, -1) } : s)),
}));

// The screen currently on top
export const useView = () => useNav((s) => s.history[s.history.length - 1]);
