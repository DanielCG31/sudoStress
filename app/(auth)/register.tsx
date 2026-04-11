import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { auth, db } from "../../lib/firebase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [semestre, setSemestre] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Crear perfil en Firestore
      await setDoc(doc(db, "users", user.uid), {
        nombre,
        semestre,
        xp: 0,
        monedas: 0,
        nivel: 1,
        creadoEn: new Date(),
      });

      router.replace("/(tabs)");
    } catch (e: any) {
      console.error(e.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <TextInput
        placeholder="Nombre"
        onChangeText={setNombre}
        style={{
          borderWidth: 2,
          borderColor: "gray",
          marginBottom: 12,
          padding: 8,
        }}
      />
      <TextInput
        placeholder="Semestre (ej: 8)"
        onChangeText={setSemestre}
        keyboardType="numeric"
        style={{
          borderWidth: 2,
          borderColor: "gray",
          marginBottom: 12,
          padding: 8,
        }}
      />
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
      <Pressable
        onPress={handleRegister}
        style={({ pressed }) => ({
          backgroundColor: pressed ? "#1d4ed8" : "#2563eb",
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
        })}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Crear cuenta</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(auth)/login")}
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
        <Text style={{ color: "#2563eb", fontWeight: "600" }}>
          Ya tengo cuenta
        </Text>
      </Pressable>
    </View>
  );
}
