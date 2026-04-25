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
import { register } from "../../lib/services/authService";
import { useAuthStore } from "../../store/useAuthStore";
import { styles } from "./auth.styles";

export default function RegisterScreen() {
  const [nombre, setNombre]               = useState("");
  const [semestre, setSemestre]           = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                 = useState("");
  const [cargando, setCargando]           = useState(false);
  const { login }                         = useAuthStore();
  const router                            = useRouter();

  const handleRegister = async () => {
    setError("");

    // Validaciones locales
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError("Por favor llena todos los campos obligatorios.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);

    try {
      const data = await register({
        name:                  nombre.trim(),
        email:                 email.trim(),
        password,
        password_confirmation: confirmPassword,
        semestre:              semestre.trim() || undefined,
      });

      if (data.token) {
        // Guardar sesión en el store (login usa AsyncStorage internamente)
        await login(email.trim(), password);
        router.replace("/(tabs)");
      } else {
        // Errores de validación de Laravel
        const errorData = data as {
          errors?: {
            email?: string[];
            password?: string[];
            name?: string[];
          };
          message?: string;
        };

        const primerError =
          errorData.errors?.email?.[0] ??
          errorData.errors?.password?.[0] ??
          errorData.errors?.name?.[0] ??
          errorData.message ??
          "No se pudo crear la cuenta.";
        setError(primerError);
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
          <Text style={styles.title}>Regístrate</Text>
          <Text style={styles.subtitle}>
            Comienza a gestionar tu estrés hoy
          </Text>

          <TextInput
            placeholder="Nombre completo *"
            value={nombre}
            onChangeText={(t) => { setNombre(t); setError(""); }}
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            placeholder="Semestre (ej: 8)"
            value={semestre}
            onChangeText={setSemestre}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#9ca3af"
            maxLength={2}
          />

          <TextInput
            placeholder="Correo electrónico *"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(""); }}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            placeholder="Contraseña * (mín. 6 caracteres)"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            placeholder="Confirmar contraseña *"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.buttonSection}>
          <Pressable
            onPress={handleRegister}
            disabled={cargando}
            style={({ pressed }) => [
              styles.buttonPrimary,
              { backgroundColor: pressed || cargando ? "#1d4ed8" : "#2563eb" },
            ]}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Crear cuenta</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={({ pressed }) => [
              styles.buttonSecondary,
              {
                borderColor:     pressed ? "#2563eb" : "#93c5fd",
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
