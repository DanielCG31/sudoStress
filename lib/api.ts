import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

export const authFetch = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const token = await AsyncStorage.getItem("token");

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};
