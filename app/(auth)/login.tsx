import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
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
import { auth } from "../../lib/firebase";
// Importamos los estilos maestros
import { styles } from "./auth.styles";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError("Correo o contraseña incorrectos");
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
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>
            Qué gusto verte de nuevo en SudoStress
          </Text>

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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.buttonSection}>
          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.buttonPrimary,
              { backgroundColor: pressed ? "#1d4ed8" : "#2563eb" },
            ]}
          >
            <Text style={styles.buttonPrimaryText}>Iniciar sesión</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/register")}
            style={({ pressed }) => [
              styles.buttonSecondary,
              {
                borderColor: pressed ? "#2563eb" : "#93c5fd",
                backgroundColor: pressed ? "#eff6ff" : "transparent",
              },
            ]}
          >
            <Text style={styles.buttonSecondaryText}>
              Crear una cuenta nueva
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
