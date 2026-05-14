'use client';
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeFolderId: string | null;
  setSidebarOpen: (open: boolean) => void;
  setActiveFolderId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Drawer state for mobile. Hidden by default; the sidebar is always
  // visible on md+ regardless of this flag via CSS.
  sidebarOpen: false,
  activeFolderId: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveFolderId: (id) => set({ activeFolderId: id }),
}));
