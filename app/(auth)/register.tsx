import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../../assets/imagenes/logo.svg";
import { register } from "../../lib/services/authService";
import { useAuthStore } from "../../store/useAuthStore";
import { registerStyles as styles } from "./auth.styles";

const SEMESTRES = [
  "1° Semestre",
  "2° Semestre",
  "3° Semestre",
  "4° Semestre",
  "5° Semestre",
  "6° Semestre",
  "7° Semestre",
  "8° Semestre",
  "9° Semestre",
  "10° Semestre",
  "11° Semestre",
  "12° Semestre",
];

export default function RegisterScreen() {
  const [nombre, setNombre] = useState("");
  const [semestre, setSemestre] = useState("");
  const [semestreLabel, setSemestreLabel] = useState("");
  const [modalSemestre, setModalSemestre] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    setError("");
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
        name: nombre.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmPassword,
        semestre: semestre || undefined,
      });
      if (data.token) {
        await login(email.trim(), password);
        router.replace("/(tabs)" as any);
      } else {
        const errorData = data as {
          errors?: { email?: string[]; password?: string[]; name?: string[] };
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

  const seleccionarSemestre = (label: string, index: number) => {
    setSemestreLabel(label);
    setSemestre(String(index + 1));
    setModalSemestre(false);
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
        {/* Header violeta */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Logo width={24} height={24} />
          </View>
          <Text style={styles.appName}>SudoStress</Text>
        </View>

        {/* Tarjeta blanca */}
        <View style={styles.card}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Registra tus datos para comenzar a gestionar tu estrés hoy
          </Text>

          <Text style={styles.label}>Nombre(s) *</Text>
          <TextInput
            placeholder="Tu nombre completo"
            value={nombre}
            onChangeText={(t) => {
              setNombre(t);
              setError("");
            }}
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Correo electrónico *</Text>
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

          {/* Select de semestre */}
          <Text style={styles.label}>Semestre</Text>
          <Pressable
            onPress={() => setModalSemestre(true)}
            style={styles.selectBox}
          >
            <Text
              style={
                semestreLabel ? styles.selectTexto : styles.selectPlaceholder
              }
            >
              {semestreLabel || "Selecciona tu semestre"}
            </Text>
            <Text style={styles.selectArrow}>▾</Text>
          </Pressable>

          <Text style={styles.label}>Contraseña * (mín. 6 caracteres)</Text>
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

          <Text style={styles.label}>Confirmar contraseña *</Text>
          <TextInput
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setError("");
            }}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleRegister}
            disabled={cargando}
            style={({ pressed }) => [
              styles.buttonPrimary,
              { backgroundColor: pressed || cargando ? "#4c1d95" : "#7c3aed" },
            ]}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Registrarse</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={({ pressed }) => [
              styles.buttonSecondary,
              {
                borderColor: pressed ? "#7c3aed" : "#c4b5fd",
                backgroundColor: pressed ? "#ede9fe" : "transparent",
              },
            ]}
          >
            <Text style={styles.buttonSecondaryText}>Ya tengo una cuenta</Text>
          </Pressable>

          <Text style={styles.footerText}>
            ¿Ya tienes cuenta?{" "}
            <Text
              style={styles.footerLink}
              onPress={() => router.push("/(auth)/login")}
            >
              Inicia sesión
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Modal selector de semestre */}
      <Modal
        visible={modalSemestre}
        transparent
        animationType="slide"
        onRequestClose={() => setModalSemestre(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalSemestre(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Selecciona tu semestre</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SEMESTRES.map((s, i) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => seleccionarSemestre(s, i)}
                  style={[
                    styles.modalOpcion,
                    semestreLabel === s && styles.modalOpcionActiva,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalOpcionTexto,
                      semestreLabel === s && styles.modalOpcionTextoActivo,
                    ]}
                  >
                    {s}
                  </Text>
                  {semestreLabel === s && (
                    <Text style={styles.modalCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setModalSemestre(false)}
              style={styles.modalCancelar}
            >
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
