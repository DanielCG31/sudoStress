import { useRouter } from "expo-router";
import { Pressable, StatusBar, Text, View } from "react-native";
import SudoSaludo from "../assets/imagenes/5sudo-stress.svg";
import Logo from "../assets/imagenes/logo.svg";

import { styles } from "./index.styles";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4c1d95" />

      {/* ── Sección superior — fondo violeta oscuro (como el panel izq. web) ── */}
      <View style={styles.heroSection}>
        {/* Overlay decorativo */}
        <View style={styles.heroOverlay} />

        {/* Logo + nombre */}
        <View style={styles.brandRow}>
          <View style={styles.iconWrap}>
            <Logo width={30} height={30} />
          </View>
          <Text style={styles.appName}>SudoStress</Text>
        </View>

        {/* Imagen de portada */}
        <SudoSaludo
          width="100%"
          height={130}
          style={{ marginBottom: 16, opacity: 0.92 }}
        />

        {/* Tagline */}
        <Text style={styles.heroTitle}>Tu semestre bajo control.</Text>
        <Text style={styles.heroSubtitle}>
          Organiza tus entregas, gestiona tus proyectos y mantén tu bienestar en
          equilibrio desde una sola plataforma.
        </Text>
      </View>

      {/* ── Sección inferior — blanca (como el panel der. web) ── */}
      <View style={styles.formSection}>
        <Text style={styles.welcomeTitle}>Bienvenido de nuevo</Text>
        <Text style={styles.welcomeSubtitle}>
          Ingresa tu información para iniciar sesión
        </Text>

        {/* Botón primario */}
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={({ pressed }) => [
            styles.buttonPrimary,
            { backgroundColor: pressed ? "#4c1d95" : "#7c3aed" },
          ]}
        >
          <Text style={styles.buttonPrimaryText}>Iniciar sesión</Text>
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
          <Text style={styles.buttonSecondaryText}>Crear una cuenta nueva</Text>
        </Pressable>

        {/* Pie */}
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
    </View>
  );
}
