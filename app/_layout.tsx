import { Slot, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { useAuthStore } from "../store/useAuthStore";

export default function RootLayout() {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Verificar que tenga perfil en Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", firebaseUser.uid), {
            nombre: firebaseUser.displayName ?? "",
            semestre: "",
            xp: 0,
            monedas: 0,
            nivel: 1,
            creadoEn: new Date(),
          });
        }
        // Redirigir al Home
        router.replace("/(tabs)");
      } else {
        // No hay sesión, ir al login
        router.replace("/(auth)/login");
      }
    });

    return unsub;
  }, []);

  return <Slot />;
}
