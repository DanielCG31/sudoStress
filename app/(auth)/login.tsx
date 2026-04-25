import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { styles } from "./auth.styles";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Por favor llena todos los campos.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      const data = await login(email.trim(), password);

      if (data.token) {
        router.replace("/(tabs)");
      } else {
        // Laravel devuelve errores de validación en data.errors
        const mensaje =
          data.errors?.email?.[0] ??
          data.message ??
          "Correo o contraseña incorrectos.";
        setError(mensaje);
      }
    } catch (e) {
      setError("No se pudo conectar al servidor.");
    } finally {
      setCargando(false);
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
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError("");
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.buttonSection}>
          <Pressable
            onPress={handleLogin}
            disabled={cargando}
            style={({ pressed }) => [
              styles.buttonPrimary,
              { backgroundColor: pressed || cargando ? "#1d4ed8" : "#2563eb" },
            ]}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Iniciar sesión</Text>
            )}
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
