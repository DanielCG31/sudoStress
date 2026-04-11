import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { auth } from "../../lib/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <TextInput
        placeholder="Correo"
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{
          borderWidth: 2,
          borderColor: "gray",
          marginBottom: 12,
          padding: 8,
        }}
      />
      <TextInput
        placeholder="Contraseña"
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 2,
          borderColor: "gray",
          marginBottom: 12,
          padding: 8,
        }}
      />
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <Pressable
        onPress={handleLogin}
        style={({ pressed }) => ({
          backgroundColor: pressed ? "#1d4ed8" : "#2563eb",
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
        })}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          Iniciar sesión
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(auth)/register")}
        style={({ pressed }) => ({
          marginTop: 12,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
          borderWidth: 1,
          borderColor: pressed ? "#2563eb" : "#93c5fd",
          backgroundColor: pressed ? "#eff6ff" : "transparent",
        })}
      >
        <Text style={{ color: "#2563eb", fontWeight: "600" }}>Registrarse</Text>
      </Pressable>
    </View>
  );
}
