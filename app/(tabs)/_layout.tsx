import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import Logo from "../../assets/imagenes/logo.svg";

// Mini-componente para el logo: SVG separado del texto para mejor control
const HeaderLogo = () => (
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <Logo width={28} height={28} style={{ marginRight: 8 }} />
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text
        style={{
          fontSize: 25,
          fontWeight: "800",
          color: "#7C3AED",
          letterSpacing: -0.5,
        }}
      >
        sudo
      </Text>
      <Text
        style={{
          fontSize: 25,
          fontWeight: "800",
          color: "#111827",
        }}
      >
        Stress
      </Text>
    </View>
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: true,
        headerTitle: () => <HeaderLogo />,
        headerStyle: {
          backgroundColor: "#F9FAFB", // Mismo color de fondo de tu app
          elevation: 0, // Quita la sombra en Android
          shadowOpacity: 0, // Quita la sombra en iOS
          borderBottomWidth: 0, // Quita la línea separadora
        },
        headerTitleAlign: "center",
        sceneStyle: { backgroundColor: "#F9FAFB" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="misiones"
        options={{
          title: "Misiones",
          tabBarIcon: ({ color }) => (
            <Ionicons name="game-controller" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
