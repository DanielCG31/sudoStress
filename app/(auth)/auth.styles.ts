import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  formSection: {
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    color: "#1f2937",
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 16,
    fontWeight: "500",
  },
  buttonSection: {
    gap: 12,
    marginBottom: 20,
  },
  buttonPrimary: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPrimaryText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonSecondary: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
  },
  buttonSecondaryText: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 16,
  },
});
