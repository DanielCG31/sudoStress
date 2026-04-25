import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  login as loginService,
  logout as logoutService,
  User,
} from "../lib/services/authService";

interface AuthStore {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  cargarSesion: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  setUser: (user: User) => {
    set({ user });
    AsyncStorage.setItem("user", JSON.stringify(user));
  },
  cargarSesion: async () => {
    const userGuardado = await AsyncStorage.getItem("user");
    set({
      user: userGuardado ? JSON.parse(userGuardado) : null,
      loading: false,
    });
  },

  login: async (email, password) => {
    const data = await loginService(email, password);
    if (data.user) set({ user: data.user });
    return data;
  },

  logout: async () => {
    await logoutService();
    set({ user: null });
  },
}));
