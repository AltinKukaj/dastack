import { create } from "zustand";

interface AppState {
  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // ── Command palette / search modal ───────────────────────────────────────
  commandOpen: boolean;
  toggleCommand: () => void;
  setCommandOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Command palette
  commandOpen: false,
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
  setCommandOpen: (open) => set({ commandOpen: open }),
}));
