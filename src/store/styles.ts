"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import { messageFromError } from "@/lib/errors";
import type { StylePack } from "@/types";

interface StyleState {
  styles: StylePack[];
  isLoading: boolean;
  loaded: boolean;
  error: string;
  loadStyles: () => Promise<void>;
}

export const useStyleStore = create<StyleState>((set, get) => ({
  styles: [],
  isLoading: false,
  loaded: false,
  error: "",

  loadStyles: async () => {
    if (get().loaded || get().isLoading) return;
    set({ isLoading: true, error: "" });
    try {
      const styles = await api.listStyles();
      set({ styles, isLoading: false, loaded: true });
    } catch (error) {
      set({ isLoading: false, error: messageFromError(error) });
    }
  }
}));
