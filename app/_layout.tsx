import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

export default function RootLayout() {
  const { user, cargarSesion, loading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void cargarSesion();
  }, [cargarSesion]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (user && inAuthGroup) {
      router.replace("/(tabs)");
      return;
    }

    if (!user && inTabsGroup) {
      router.replace("/");
    }
  }, [loading, router, segments, user]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
