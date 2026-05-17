import { Dimensions, StyleSheet } from "react-native";

const { height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  // ── Contenedor raíz ─────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // ── Hero (panel superior — violeta como la web) ──────────
  heroSection: {
    height: height * 0.52, // ocupa ~52% de la pantalla
    backgroundColor: "#4c1d95", // eco-dark de la web
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 24,
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },

  // Degradado decorativo (imita el overlay de la web)
  heroOverlay: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(124, 58, 237, 0.35)", // violeta translúcido
  },

  // Fila logo + nombre (como "SudoStress" en la web)
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    fontSize: 22,
  },

  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },

  // Imagen hero (reemplaza la foto de fondo de la web)
  heroImage: {
    width: "100%",
    height: 130,
    resizeMode: "contain",
    marginBottom: 16,
    opacity: 0.92,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 34,
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    color: "#ddd6fe", // verde-50 equivalente en violeta
    lineHeight: 20,
  },

  // ── Panel inferior (blanco — como el formulario de la web) ──
  formSection: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20, // se monta encima del hero
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
    justifyContent: "center",
    // Sombra sutil arriba
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },

  welcomeTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },

  welcomeSubtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },

  // ── Botones (mismos colores que la web) ─────────────────
  buttonPrimary: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    // Sombra violeta igual que la web
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonPrimaryText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  buttonSecondary: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    marginBottom: 24,
  },

  buttonSecondaryText: {
    color: "#7c3aed",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // ── Pie de página ────────────────────────────────────────
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6b7280",
  },

  footerLink: {
    color: "#7c3aed",
    fontWeight: "600",
  },
});
