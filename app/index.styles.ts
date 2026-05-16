import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-between", // Esto empuja la marca hacia arriba y los botones hacia abajo
    padding: 30, // Un poco más de margen exterior
  },
  brandingSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // Centra el logo y nombre verticalmente en su espacio
    marginTop: 80, // Un poco de espacio desde arriba
  },
  logo: {
    width: 350, // Un buen tamaño para el logo principal
    height: 200,
    resizeMode: "contain", // Asegura que el logo no se distorsione
    marginBottom: 20,
    marginLeft: -20, // Ajuste fino para centrar visualmente el logo con el texto
  },
  appName: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#111827", // Un gris oscuro casi negro
    fontFamily: "", // Usa la fuente del sistema para un aspecto nativo
  },
  slogan: {
    fontSize: 16,
    color: "#6b7280", // Un gris más suave
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  buttonSection: {
    width: "100%",
    gap: 15, // Espacio entre los dos botones
    marginBottom: 40, // Espacio desde el borde inferior
  },
  // --- Estilos de botones copiados y adaptados de login.tsx ---
  buttonPrimary: {
    paddingVertical: 14, // Un poco más alto
    borderRadius: 12, // Un poco más redondeado
    alignItems: "center",
  },
  buttonPrimaryText: {
    color: "white",
    fontWeight: "600",
    fontSize: 17, // Un poco más grande
  },
  buttonSecondary: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
  },
  buttonSecondaryText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 17,
  },
});
