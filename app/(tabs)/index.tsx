import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  checkinHoy,
  registrarCheckin,
} from "../../lib/services/checkinService";
import { obtenerTareas } from "../../lib/services/tareaService";
import { useAuthStore } from "../../store/useAuthStore";

const FRASES = [
  "Un paso a la vez. Tú puedes con esto. 💪",
  "El descanso también es productividad. 🌙",
  "Organízate hoy, respira mañana. 📋",
  "Tu esfuerzo vale más de lo que crees. ⭐",
  "No tienes que hacerlo perfecto, solo hacerlo. 🎯",
];

const getEmoji = (nivel: number) => {
  if (nivel <= 2)
    return { emoji: "😄", label: "Muy tranquilo", color: "#4CAF50" };
  if (nivel <= 4) return { emoji: "🙂", label: "Tranquilo", color: "#8BC34A" };
  if (nivel <= 6)
    return { emoji: "😐", label: "Algo estresado", color: "#FFC107" };
  if (nivel <= 8) return { emoji: "😟", label: "Estresado", color: "#FF9800" };
  return { emoji: "😰", label: "Muy estresado", color: "#F44336" };
};

type Tarea = {
  id: number;
  titulo: string;
  fecha_limite: string | null;
  estado: string;
};

type CheckinData = {
  id: number;
  nivel_estres: number;
} | null;

type Mision = {
  titulo: string;
  xp_recompensa: number;
};

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [nivelEstres, setNivelEstres] = useState(5);
  const [checkinData, setCheckinData] = useState<CheckinData>(null);
  const [tareasPendientes, setTareasPendientes] = useState<Tarea[]>([]);
  const [misionesIA, setMisionesIA] = useState<Mision[]>([]);
  const [consejoIA, setConsejoIA] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const frase = FRASES[new Date().getDay() % FRASES.length];
  const estadoEstres = getEmoji(
    checkinData ? checkinData.nivel_estres : nivelEstres,
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Verificar checkin de hoy
      const hoyRes = await checkinHoy();
      if (hoyRes.checkin) {
        setCheckinData(hoyRes.checkin);
        setNivelEstres(hoyRes.checkin.nivel_estres);
      }

      // Tareas próximas pendientes
      const tareasRes = await obtenerTareas({ estado: "pendiente" });
      setTareasPendientes(tareasRes.tareas?.slice(0, 3) ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const guardarCheckin = async () => {
    setGuardando(true);
    try {
      const data = await registrarCheckin(nivelEstres);

      // Actualizar datos del usuario en el store (XP puede haber cambiado)
      if (data.checkin) {
        setCheckinData(data.checkin);
      }
      if (data.misiones) setMisionesIA(data.misiones.slice(0, 1)); // mostrar la primera
      if (data.consejo) setConsejoIA(data.consejo);

      // Refrescar XP del usuario
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Saludo + XP */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>
            Hola, {user?.name || "estudiante"}{" "}
            <MaterialCommunityIcons
              name="human-greeting-variant"
              size={24}
              color="black"
            />
          </Text>
          <Text style={styles.fecha}>
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>⭐ {user?.xp ?? 0} XP</Text>
          <Text style={styles.nivelText}>Nivel {user?.nivel ?? 1}</Text>
        </View>
      </View>

      {/* Frase motivacional o consejo de IA */}
      <View style={styles.fraseCard}>
        <Text style={styles.fraseTexto}>{consejoIA ?? frase}</Text>
      </View>

      {/* Check-in de estrés */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>¿Cómo te sientes hoy?</Text>

        {checkinData ? (
          <View style={styles.checkinHecho}>
            <Text style={styles.emojiGrande}>{estadoEstres.emoji}</Text>
            <Text style={[styles.labelEstres, { color: estadoEstres.color }]}>
              {estadoEstres.label} — Nivel {checkinData.nivel_estres}/10
            </Text>
            <Text style={styles.checkinHechoTexto}>
              ✅ Check-in completado hoy (+10 XP)
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.sliderHeader}>
              <Text style={styles.emojiGrande}>{estadoEstres.emoji}</Text>
              <Text style={[styles.nivelNumero, { color: estadoEstres.color }]}>
                {nivelEstres}/10
              </Text>
            </View>
            <Text
              style={[
                styles.labelEstres,
                { color: estadoEstres.color, textAlign: "center" },
              ]}
            >
              {estadoEstres.label}
            </Text>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={nivelEstres}
              onValueChange={setNivelEstres}
              minimumTrackTintColor={estadoEstres.color}
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor={estadoEstres.color}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelTexto}>😄 Tranquilo</Text>
              <Text style={styles.sliderLabelTexto}>😰 Muy estresado</Text>
            </View>
            <Pressable
              style={[styles.botonCheckin, guardando && { opacity: 0.6 }]}
              onPress={guardarCheckin}
              disabled={guardando}
            >
              <Text style={styles.botonTexto}>
                {guardando
                  ? "Analizando con IA..."
                  : "Registrar mi estado de hoy"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Misión recomendada por IA (después del checkin) */}
      {misionesIA.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>🎯 Misión recomendada por IA</Text>
          <Text style={styles.misionTitulo}>{misionesIA[0].titulo}</Text>
          <Text style={styles.misionXP}>
            Recompensa: +{misionesIA[0].xp_recompensa} XP
          </Text>
        </View>
      )}

      {/* Misión fija si no hay checkin aún */}
      {!checkinData && misionesIA.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>🎯 Misión sugerida</Text>
          <Text style={styles.misionTitulo}>
            {nivelEstres <= 3
              ? "📚 Adelanta una tarea pendiente"
              : nivelEstres <= 6
                ? "📝 Haz una lista de tus pendientes"
                : "🧘 Toma 10 minutos para respirar y descansar"}
          </Text>
          <Text style={styles.misionXP}>
            Haz tu check-in para obtener misiones personalizadas ✨
          </Text>
        </View>
      )}

      {/* Tareas próximas */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>📅 Próximas entregas</Text>
        {tareasPendientes.length === 0 ? (
          <Text style={styles.sinTareas}>No tienes tareas pendientes 🎉</Text>
        ) : (
          tareasPendientes.map((tarea) => (
            <View key={tarea.id} style={styles.tareaItem}>
              <Text style={styles.tareaTitulo}>{tarea.titulo}</Text>
              {tarea.fecha_limite && (
                <Text style={styles.tareaFecha}>
                  📆 {new Date(tarea.fecha_limite).toLocaleDateString("es-MX")}
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3FF",
    padding: 16,
    paddingTop: 41,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  saludo: { fontSize: 24, fontWeight: "bold", color: "#1E1B4B" },
  fecha: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    textTransform: "capitalize",
  },
  xpBadge: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  xpText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  nivelText: { color: "#DDD6FE", fontSize: 11, marginTop: 2 },
  fraseCard: {
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  fraseTexto: {
    color: "#5B21B6",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E1B4B",
    marginBottom: 12,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emojiGrande: { fontSize: 40 },
  nivelNumero: { fontSize: 32, fontWeight: "bold" },
  labelEstres: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabelTexto: { fontSize: 11, color: "#9CA3AF" },
  botonCheckin: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  botonTexto: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  checkinHecho: { alignItems: "center", gap: 8, paddingVertical: 8 },
  checkinHechoTexto: { color: "#6B7280", fontSize: 13 },
  misionTitulo: { fontSize: 15, color: "#374151", marginBottom: 6 },
  misionXP: { fontSize: 13, color: "#7C3AED", fontWeight: "600" },
  sinTareas: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 8,
  },
  tareaItem: {
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
    paddingLeft: 12,
    marginBottom: 10,
  },
  tareaTitulo: { fontSize: 14, color: "#374151", fontWeight: "500" },
  tareaFecha: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
});
