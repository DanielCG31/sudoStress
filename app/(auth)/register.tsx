import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../../lib/firebase";
// Importamos los estilos maestros
import { styles } from "./auth.styles";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [semestre, setSemestre] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await setDoc(doc(db, "users", user.uid), {
        nombre,
        semestre,
        xp: 0,
        monedas: 0,
        nivel: 1,
        creadoEn: new Date(),
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error(e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <Text style={styles.title}>Regístrate</Text>
          <Text style={styles.subtitle}>
            Comienza a gestionar tu estrés hoy
          </Text>

          <TextInput
            placeholder="Nombre completo"
            onChangeText={setNombre}
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            placeholder="Semestre (ej: 8)"
            onChangeText={setSemestre}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            placeholder="Correo electrónico"
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            placeholder="Contraseña"
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.buttonSection}>
          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.buttonPrimary,
              { backgroundColor: pressed ? "#1d4ed8" : "#2563eb" },
            ]}
          >
            <Text style={styles.buttonPrimaryText}>Crear cuenta</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={({ pressed }) => [
              styles.buttonSecondary,
              {
                borderColor: pressed ? "#2563eb" : "#93c5fd",
                backgroundColor: pressed ? "#eff6ff" : "transparent",
              },
            ]}
          >
            <Text style={styles.buttonSecondaryText}>Ya tengo una cuenta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
