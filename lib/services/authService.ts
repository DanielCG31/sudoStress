import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../constants/api";

export interface User {
  id: number;
  name: string;
  email: string;
  semestre: string | null;
  role: "user" | "admin";
  nivel: number;
  xp: number;
  monedas: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const register = async (datos: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  semestre?: string;
}): Promise<AuthResponse> => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (data.token) {
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
};

export const logout = async (): Promise<void> => {
  const token = await AsyncStorage.getItem("token");

  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
};
