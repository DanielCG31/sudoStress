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
import Logo from "../../assets/imagenes/logo.svg";
import { useAuthStore } from "../../store/useAuthStore";
import { loginStyles as styles } from "./auth.styles";

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
        router.replace("/");
      } else {
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
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header violeta ── */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Logo width={24} height={24} />
          </View>
          <Text style={styles.appName}>SudoStress</Text>
        </View>

        {/* ── Tarjeta blanca ── */}
        <View style={styles.card}>
          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitle}>
            Ingresa tu información para iniciar sesión
          </Text>

          {/* Email */}
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            placeholder="usuario@gmail.com"
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

          {/* Contraseña */}
          <View style={styles.passwordRow}>
            <Text style={styles.label}>Contraseña</Text>
            <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
          </View>
          <TextInput
            placeholder="••••••••"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Botón primario */}
          <Pressable
            onPress={handleLogin}
            disabled={cargando}
            style={({ pressed }) => [
              styles.buttonPrimary,
              { backgroundColor: pressed || cargando ? "#4c1d95" : "#7c3aed" },
            ]}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Iniciar sesión</Text>
            )}
          </Pressable>

          {/* Botón secundario */}
          <Pressable
            onPress={() => router.push("/(auth)/register")}
            style={({ pressed }) => [
              styles.buttonSecondary,
              {
                borderColor: pressed ? "#7c3aed" : "#c4b5fd",
                backgroundColor: pressed ? "#ede9fe" : "transparent",
              },
            ]}
          >
            <Text style={styles.buttonSecondaryText}>
              Crear una cuenta nueva
            </Text>
          </Pressable>

          {/* Footer */}
          <Text style={styles.footerText}>
            ¿No tienes cuenta?{" "}
            <Text
              style={styles.footerLink}
              onPress={() => router.push("/(auth)/register")}
            >
              Regístrate aquí
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
