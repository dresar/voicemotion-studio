"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import { clearToken, readCachedUser, readToken, writeCachedUser, writeToken } from "@/lib/authToken";
import { messageFromError } from "@/lib/errors";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  hydrating: boolean;
  hydrated: boolean;
  error: string;
  hydrate: () => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithToken: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  setCredits: (credits: number) => void;
  clearError: () => void;
}

function readCachedUserValue(): User | null {
  const raw = readCachedUser();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrating: false,
  hydrated: false,
  error: "",

  hydrate: async () => {
    if (get().hydrated || get().hydrating) return;
    const token = readToken();
    const cachedUser = readCachedUserValue();
    if (!token) {
      set({ user: null, token: null, hydrated: true, hydrating: false });
      return;
    }
    set({ token, user: cachedUser, hydrating: true });
    try {
      const user = await api.me();
      writeCachedUser(user);
      set({ user, token, hydrating: false, hydrated: true, error: "" });
    } catch (error) {
      clearToken();
      set({ user: null, token: null, hydrating: false, hydrated: true, error: messageFromError(error) });
    }
  },

  loginEmail: async (email, password) => {
    set({ hydrating: true, error: "" });
    try {
      const response = await api.loginEmail(email, password);
      writeToken(response.token);
      writeCachedUser(response.user);
      set({ user: response.user, token: response.token, hydrating: false, hydrated: true });
      return { ok: true };
    } catch (error) {
      const message = messageFromError(error);
      set({ hydrating: false, hydrated: true, error: message });
      return { ok: false, error: message };
    }
  },

  loginWithToken: async (token) => {
    writeToken(token);
    set({ token, user: null, hydrating: true, hydrated: false, error: "" });
    try {
      const user = await api.me();
      writeCachedUser(user);
      set({ user, token, hydrating: false, hydrated: true });
      return true;
    } catch (error) {
      clearToken();
      set({ user: null, token: null, hydrating: false, hydrated: true, error: messageFromError(error) });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      set({ error: "" });
    }
    clearToken();
    set({ user: null, token: null, hydrating: false, hydrated: true, error: "" });
  },

  refreshUser: async () => {
    try {
      const user = await api.me();
      writeCachedUser(user);
      set({ user });
    } catch (error) {
      set({ error: messageFromError(error) });
    }
  },

  setUser: (user) => {
    writeCachedUser(user);
    set({ user });
  },

  setCredits: (credits) => {
    const user = get().user;
    if (!user) return;
    const nextUser = { ...user, credits };
    writeCachedUser(nextUser);
    set({ user: nextUser });
  },

  clearError: () => set({ error: "" })
}));
