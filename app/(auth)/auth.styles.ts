import { StyleSheet } from "react-native";

const C = {
  violet: "#7c3aed",
  violetDark: "#4c1d95",
  violetPale: "#ede9fe",
  violetBorder: "#c4b5fd",
  ink: "#111827",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  grayBorder: "#e5e7eb",
  white: "#ffffff",
  error: "#ef4444",
  errorBg: "#fef2f2",
};

const base = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.violetDark,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 32,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 20 },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.5,
  },
  card: {
    flex: 1,
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.ink,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: C.gray,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.grayLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 15,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.grayBorder,
  },

  // ── Select de semestre ───────────────────────────────────
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.grayLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.grayBorder,
  },
  selectTexto: {
    fontSize: 15,
    color: C.ink,
  },
  selectPlaceholder: {
    fontSize: 15,
    color: "#9ca3af",
  },
  selectArrow: {
    fontSize: 16,
    color: C.gray,
  },

  // ── Modal de opciones ────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.grayBorder,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: C.ink,
    textAlign: "center",
    marginBottom: 16,
  },
  modalOpcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOpcionActiva: {
    backgroundColor: C.violetPale,
  },
  modalOpcionTexto: {
    fontSize: 15,
    color: C.ink,
  },
  modalOpcionTextoActivo: {
    color: C.violet,
    fontWeight: "700",
  },
  modalCheck: {
    fontSize: 16,
    color: C.violet,
    fontWeight: "700",
  },
  modalCancelar: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.grayLight,
    alignItems: "center",
  },
  modalCancelarTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: C.gray,
  },

  // ── Error ────────────────────────────────────────────────
  errorBox: {
    backgroundColor: C.errorBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Botones ──────────────────────────────────────────────
  buttonPrimary: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimaryText: {
    color: C.white,
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
    color: C.violet,
    fontWeight: "700",
    fontSize: 16,
  },

  // ── Footer ───────────────────────────────────────────────
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: C.gray,
  },
  footerLink: {
    color: C.violet,
    fontWeight: "600",
  },

  // ── Solo login ───────────────────────────────────────────
  passwordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    color: C.violet,
    fontWeight: "600",
  },
});

export const loginStyles = base;
export const registerStyles = base;
export const styles = base;
