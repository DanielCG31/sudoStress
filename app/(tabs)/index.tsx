import Slider from "@react-native-community/slider";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../../lib/firebase";

// Frases motivacionales
const FRASES = [
  "Un paso a la vez. Tú puedes con esto. 💪",
  "El descanso también es productividad. 🌙",
  "Organízate hoy, respira mañana. 📋",
  "Tu esfuerzo vale más de lo que crees. ⭐",
  "No tienes que hacerlo perfecto, solo hacerlo. 🎯",
];

// Emoji según nivel de estrés
const getEmoji = (nivel: number) => {
  if (nivel <= 2)
    return { emoji: "😄", label: "Muy tranquilo", color: "#4CAF50" };
  if (nivel <= 4) return { emoji: "🙂", label: "Tranquilo", color: "#8BC34A" };
  if (nivel <= 6)
    return { emoji: "😐", label: "Algo estresado", color: "#FFC107" };
  if (nivel <= 8) return { emoji: "😟", label: "Estresado", color: "#FF9800" };
  return { emoji: "😰", label: "Muy estresado", color: "#F44336" };
};

// Misión recomendada según nivel
const getMisionRecomendada = (nivel: number) => {
  if (nivel <= 3) return { titulo: "📚 Adelanta una tarea pendiente", xp: 30 };
  if (nivel <= 6)
    return { titulo: "📝 Haz una lista de tus pendientes", xp: 20 };
  return { titulo: "🧘 Toma 10 minutos para respirar y descansar", xp: 15 };
};

export default function HomeScreen() {
  const [perfil, setPerfil] = useState<any>(null);
  const [nivelEstres, setNivelEstres] = useState(5);
  const [checkinHecho, setCheckinHecho] = useState(false);
  const [tareasPendientes, setTareasPendientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const frase = FRASES[new Date().getDay() % FRASES.length];
  const estadoEstres = getEmoji(nivelEstres);
  const mision = getMisionRecomendada(checkinHecho ? nivelEstres : 5);
  const hoy = new Date().toISOString().split("T")[0]; // "2026-04-11"

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      // Cargar perfil
      const perfilDoc = await getDoc(doc(db, "users", uid));
      if (perfilDoc.exists()) setPerfil(perfilDoc.data());

      // Verificar si ya hizo check-in hoy
      const checkinDoc = await getDoc(doc(db, "users", uid, "checkins", hoy));
      if (checkinDoc.exists()) {
        setCheckinHecho(true);
        setNivelEstres(checkinDoc.data().nivelEstres);
      }

      // Cargar tareas próximas (las 3 más cercanas sin completar)
      const tareasRef = collection(db, "users", uid, "tareas");
      const q = query(
        tareasRef,
        where("completada", "==", false),
        orderBy("fechaEntrega"),
        limit(3),
      );
      const snapshot = await getDocs(q);
      setTareasPendientes(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const guardarCheckin = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setGuardando(true);

    try {
      // Guardar check-in
      await setDoc(doc(db, "users", uid, "checkins", hoy), {
        nivelEstres,
        fecha: hoy,
        creadoEn: new Date(),
      });

      // Dar XP al usuario por hacer el check-in
      const xpActual = perfil?.xp ?? 0;
      const nuevoXP = xpActual + 10;
      await setDoc(doc(db, "users", uid), { xp: nuevoXP }, { merge: true });
      setPerfil((prev: any) => ({ ...prev, xp: nuevoXP }));
      setCheckinHecho(true);
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
            Hola, {perfil?.nombre || "estudiante"} 👋
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
          <Text style={styles.xpText}>⭐ {perfil?.xp ?? 0} XP</Text>
          <Text style={styles.nivelText}>Nivel {perfil?.nivel ?? 1}</Text>
        </View>
      </View>

      {/* Frase motivacional */}
      <View style={styles.fraseCard}>
        <Text style={styles.fraseTexto}>{frase}</Text>
      </View>

      {/* Check-in de estrés */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>¿Cómo te sientes hoy?</Text>

        {checkinHecho ? (
          <View style={styles.checkinHecho}>
            <Text style={styles.emojiGrande}>{estadoEstres.emoji}</Text>
            <Text style={[styles.labelEstres, { color: estadoEstres.color }]}>
              {estadoEstres.label} — Nivel {nivelEstres}/10
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
                {guardando ? "Guardando..." : "Registrar mi estado de hoy"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Misión recomendada */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>🎯 Misión recomendada</Text>
        <Text style={styles.misionTitulo}>{mision.titulo}</Text>
        <Text style={styles.misionXP}>Recompensa: +{mision.xp} XP</Text>
      </View>

      {/* Tareas próximas */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>📅 Próximas entregas</Text>
        {tareasPendientes.length === 0 ? (
          <Text style={styles.sinTareas}>No tienes tareas pendientes 🎉</Text>
        ) : (
          tareasPendientes.map((tarea) => (
            <View key={tarea.id} style={styles.tareaItem}>
              <Text style={styles.tareaTitulo}>{tarea.titulo}</Text>
              <Text style={styles.tareaFecha}>
                📆{" "}
                {new Date(
                  tarea.fechaEntrega?.seconds * 1000,
                ).toLocaleDateString("es-MX")}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F3FF", padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  saludo: { fontSize: 22, fontWeight: "bold", color: "#1E1B4B" },
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
