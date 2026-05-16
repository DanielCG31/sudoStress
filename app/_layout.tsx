import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

export default function RootLayout() {
  const { user, cargarSesion, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    void cargarSesion();
  }, [cargarSesion]);

  useEffect(() => {
    if (loading) {
      return;
    }

    router.replace(user ? "/(tabs)" : "/");
  }, [loading, router, user]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
