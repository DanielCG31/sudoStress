import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { styles } from "./index.styles";

export default function HomeScreen() {
  const router = useRouter();
  const logo = require("../assets/imagenes/image.png");

  return (
    <View style={styles.container}>
      {/* Sección superior para el logo y nombre */}
      <View style={styles.brandingSection}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.appName}>SudoStress</Text>
        <Text style={styles.slogan}>
          Tu compañero para gestionar el estrés día a día
        </Text>
      </View>

      {/* Sección inferior para los botones */}
      <View style={styles.buttonSection}>
        {/* Botón de Iniciar Sesión (Estilo principal azul) */}
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={({ pressed }) => [
            styles.buttonPrimary,
            {
              backgroundColor: pressed ? "#1d4ed8" : "#2563eb",
            },
          ]}
        >
          <Text style={styles.buttonPrimaryText}>Iniciar sesión</Text>
        </Pressable>

        {/* Botón de Registrarse (Estilo fantasma/contorno) */}
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
          <Text style={styles.buttonSecondaryText}>Registrarse</Text>
        </Pressable>
      </View>
    </View>
  );
}
