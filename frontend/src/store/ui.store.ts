'use client';
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeFolderId: string | null;
  setSidebarOpen: (open: boolean) => void;
  setActiveFolderId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeFolderId: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveFolderId: (id) => set({ activeFolderId: id }),
}));
