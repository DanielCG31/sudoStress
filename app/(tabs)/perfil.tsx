import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { auth, db } from "../../lib/firebase";

type Perfil = {
  nombre: string;
  semestre: string;
  xp: number;
  nivel: number;
  monedas: number;
};

type Checkin = {
  fecha: string;
  nivelEstres: number;
};

type Logro = {
  id: string;
  titulo: string;
  descripcion: string;
  emoji: string;
  desbloqueado: boolean;
  condicion: (datos: {
    checkins: Checkin[];
    misionesCompletadas: number;
    xp: number;
  }) => boolean;
};

const LOGROS: Omit<Logro, "desbloqueado">[] = [
  {
    id: "primer_checkin",
    titulo: "Primer paso",
    descripcion: "Haz tu primer check-in de estrés",
    emoji: "🌱",
    condicion: ({ checkins }) => checkins.length >= 1,
  },
  {
    id: "semana_completa",
    titulo: "Semana completa",
    descripcion: "Haz check-in 7 días seguidos",
    emoji: "🔥",
    condicion: ({ checkins }) => checkins.length >= 7,
  },
  {
    id: "primer_mision",
    titulo: "Misionero",
    descripcion: "Completa tu primera misión",
    emoji: "🎯",
    condicion: ({ misionesCompletadas }) => misionesCompletadas >= 1,
  },
  {
    id: "cinco_misiones",
    titulo: "En racha",
    descripcion: "Completa 5 misiones",
    emoji: "⚡",
    condicion: ({ misionesCompletadas }) => misionesCompletadas >= 5,
  },
  {
    id: "diez_misiones",
    titulo: "Imparable",
    descripcion: "Completa 10 misiones",
    emoji: "🏆",
    condicion: ({ misionesCompletadas }) => misionesCompletadas >= 10,
  },
  {
    id: "nivel_5",
    titulo: "Subiendo",
    descripcion: "Llega al nivel 5",
    emoji: "🚀",
    condicion: ({ xp }) => xp >= 400,
  },
  {
    id: "nivel_10",
    titulo: "Veterano",
    descripcion: "Llega al nivel 10",
    emoji: "👑",
    condicion: ({ xp }) => xp >= 900,
  },
  {
    id: "zen",
    titulo: "Zen",
    descripcion: "Registra estrés menor a 3 por 3 días",
    emoji: "🧘",
    condicion: ({ checkins }) => {
      const bajos = checkins.filter((c) => c.nivelEstres <= 3);
      return bajos.length >= 3;
    },
  },
];

const getColorNivel = (nivel: number) => {
  if (nivel < 3) return "#10B981";
  if (nivel < 5) return "#F59E0B";
  if (nivel < 7) return "#EF4444";
  return "#7C3AED";
};

export default function PerfilScreen() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [misionesCompletadas, setMisionesCompletadas] = useState(0);
  const [logros, setLogros] = useState<Logro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalEditar, setModalEditar] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoSemestre, setNuevoSemestre] = useState("");
  const router = useRouter();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      // Perfil
      const perfilDoc = await getDoc(doc(db, "users", uid));
      const perfilData = perfilDoc.data() as Perfil;
      setPerfil(perfilData);
      setNuevoNombre(perfilData.nombre);
      setNuevoSemestre(perfilData.semestre);

      // Checkins últimos 7 días
      const checkinsSnap = await getDocs(
        query(
          collection(db, "users", uid, "checkins"),
          orderBy("fecha", "desc"),
          limit(7),
        ),
      );
      const checkinsData = checkinsSnap.docs
        .map((d) => d.data() as Checkin)
        .reverse();
      setCheckins(checkinsData);

      // Misiones completadas
      const misionesSnap = await getDocs(
        collection(db, "users", uid, "misiones"),
      );
      const completadas = misionesSnap.docs.filter(
        (d) => d.data().completada,
      ).length;
      setMisionesCompletadas(completadas);

      // Evaluar logros
      const datos = {
        checkins: checkinsData,
        misionesCompletadas: completadas,
        xp: perfilData.xp,
      };
      const logrosEvaluados = LOGROS.map((l) => ({
        ...l,
        desbloqueado: l.condicion(datos),
      }));
      setLogros(logrosEvaluados);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const guardarPerfil = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await updateDoc(doc(db, "users", uid), {
        nombre: nuevoNombre.trim(),
        semestre: nuevoSemestre.trim(),
      });
      setPerfil((prev) =>
        prev ? { ...prev, nombre: nuevoNombre, semestre: nuevoSemestre } : prev,
      );
      setModalEditar(false);
    } catch (e) {
      console.error(e);
    }
  };

  const cerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  // Datos para la gráfica
  const datosGrafica = checkins.map((c) => ({
    value: c.nivelEstres,
    label: c.fecha.slice(5), // "04-11"
    dataPointColor: getColorNivel(c.nivelEstres),
  }));

  const promedioEstres = checkins.length
    ? (
        checkins.reduce((acc, c) => acc + c.nivelEstres, 0) / checkins.length
      ).toFixed(1)
    : "—";

  const xpParaSiguienteNivel = perfil ? perfil.nivel * 100 - perfil.xp : 0;
  const progresoNivel = perfil ? ((perfil.xp % 100) / 100) * 100 : 0;

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
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header perfil */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCirculo}>
          <Text style={styles.avatarLetra}>
            {perfil?.nombre?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.nombreTexto}>
            {perfil?.nombre || "Sin nombre"}
          </Text>
          <Text style={styles.semestreTexto}>
            {perfil?.semestre
              ? `Semestre ${perfil.semestre}`
              : "ISC — ITMatamoros"}
          </Text>
          <Text style={styles.emailTexto}>{auth.currentUser?.email}</Text>
        </View>
        <Pressable
          onPress={() => setModalEditar(true)}
          style={styles.editarBtn}
        >
          <Ionicons name="pencil" size={18} color="#7C3AED" />
        </Pressable>
      </View>

      {/* Nivel y XP */}
      <View style={styles.card}>
        <View style={styles.nivelRow}>
          <Text style={styles.cardTitulo}>Nivel {perfil?.nivel ?? 1}</Text>
          <Text style={styles.xpTexto}>⭐ {perfil?.xp ?? 0} XP</Text>
        </View>
        {/* Barra de progreso */}
        <View style={styles.barraFondo}>
          <View
            style={[styles.barraProgreso, { width: `${progresoNivel}%` }]}
          />
        </View>
        <Text style={styles.xpFaltante}>
          {xpParaSiguienteNivel > 0
            ? `Faltan ${xpParaSiguienteNivel} XP para el nivel ${(perfil?.nivel ?? 1) + 1}`
            : "¡Nivel máximo!"}
        </Text>
      </View>

      {/* Stats rápidas */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>{checkins.length}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>{misionesCompletadas}</Text>
          <Text style={styles.statLabel}>Misiones</Text>
        </View>
        <View style={styles.statCard}>
          <Text
            style={[
              styles.statNumero,
              {
                color: getColorNivel(parseFloat(promedioEstres as string) || 0),
              },
            ]}
          >
            {promedioEstres}
          </Text>
          <Text style={styles.statLabel}>Estrés prom.</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>
            {logros.filter((l) => l.desbloqueado).length}
          </Text>
          <Text style={styles.statLabel}>Logros</Text>
        </View>
      </View>

      {/* Gráfica de estrés */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>📊 Estrés últimos 7 días</Text>
        {checkins.length < 2 ? (
          <View style={styles.graficaVacia}>
            <Text style={styles.graficaVaciaTexto}>
              Necesitas al menos 2 check-ins para ver la gráfica
            </Text>
          </View>
        ) : (
          <LineChart
            data={datosGrafica}
            width={280}
            height={160}
            maxValue={10}
            noOfSections={5}
            color="#7C3AED"
            thickness={2}
            startFillColor="#EDE9FE"
            endFillColor="#F5F3FF"
            areaChart
            curved
            hideDataPoints={false}
            dataPointsColor="#7C3AED"
            dataPointsRadius={4}
            xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
            yAxisTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
            yAxisColor="transparent"
            xAxisColor="#E5E7EB"
            rulesColor="#F3F4F6"
          />
        )}
      </View>

      {/* Historial check-ins */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>📅 Historial de check-ins</Text>
        {checkins.length === 0 ? (
          <Text style={styles.sinDatos}>
            Aún no tienes check-ins registrados
          </Text>
        ) : (
          [...checkins].reverse().map((c, i) => {
            const color = getColorNivel(c.nivelEstres);
            return (
              <View key={i} style={styles.checkinItem}>
                <View style={[styles.checkinDot, { backgroundColor: color }]} />
                <Text style={styles.checkinFecha}>{c.fecha}</Text>
                <View
                  style={[
                    styles.checkinBadge,
                    { backgroundColor: color + "20" },
                  ]}
                >
                  <Text style={[styles.checkinNivel, { color }]}>
                    Nivel {c.nivelEstres}/10
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Logros */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>🏆 Logros</Text>
        <View style={styles.logrosGrid}>
          {logros.map((logro) => (
            <View
              key={logro.id}
              style={[
                styles.logroCard,
                !logro.desbloqueado && styles.logroBloqueado,
              ]}
            >
              <Text style={styles.logroEmoji}>
                {logro.desbloqueado ? logro.emoji : "🔒"}
              </Text>
              <Text
                style={[
                  styles.logroTitulo,
                  !logro.desbloqueado && styles.logroTextoGris,
                ]}
              >
                {logro.titulo}
              </Text>
              <Text
                style={[
                  styles.logroDesc,
                  !logro.desbloqueado && styles.logroTextoGris,
                ]}
              >
                {logro.descripcion}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Cerrar sesión */}
      <Pressable style={styles.botonCerrar} onPress={cerrarSesion}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.botonCerrarTexto}>Cerrar sesión</Text>
      </Pressable>

      {/* Modal editar perfil */}
      <Modal visible={modalEditar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Editar perfil ✏️</Text>

            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Tu nombre"
              maxLength={40}
            />

            <Text style={styles.inputLabel}>Semestre</Text>
            <TextInput
              style={styles.input}
              value={nuevoSemestre}
              onChangeText={setNuevoSemestre}
              placeholder="Ej: 8"
              keyboardType="numeric"
              maxLength={2}
            />

            <View style={styles.modalBotones}>
              <Pressable
                style={styles.botonCancelar}
                onPress={() => setModalEditar(false)}
              >
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.botonGuardar} onPress={guardarPerfil}>
                <Text style={styles.botonGuardarTexto}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3FF",
    padding: 16,
    paddingTop: 48,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerCard: {
    backgroundColor: "#7C3AED",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatarCirculo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetra: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  headerInfo: { flex: 1 },
  nombreTexto: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  semestreTexto: { fontSize: 13, color: "#DDD6FE", marginTop: 2 },
  emailTexto: { fontSize: 11, color: "#C4B5FD", marginTop: 2 },
  editarBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E1B4B",
    marginBottom: 12,
  },
  nivelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  xpTexto: { fontSize: 15, fontWeight: "700", color: "#7C3AED" },
  barraFondo: {
    height: 10,
    backgroundColor: "#EDE9FE",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 6,
  },
  barraProgreso: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
  },
  xpFaltante: { fontSize: 12, color: "#9CA3AF" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumero: { fontSize: 20, fontWeight: "bold", color: "#7C3AED" },
  statLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "center",
  },
  graficaVacia: { height: 100, justifyContent: "center", alignItems: "center" },
  graficaVaciaTexto: { color: "#9CA3AF", fontSize: 13, textAlign: "center" },
  checkinItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  checkinDot: { width: 10, height: 10, borderRadius: 5 },
  checkinFecha: { flex: 1, fontSize: 13, color: "#6B7280" },
  checkinBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  checkinNivel: { fontSize: 12, fontWeight: "700" },
  sinDatos: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  logrosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  logroCard: {
    width: "47%",
    backgroundColor: "#F5F3FF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  logroBloqueado: { backgroundColor: "#F9FAFB", opacity: 0.6 },
  logroEmoji: { fontSize: 28, marginBottom: 4 },
  logroTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E1B4B",
    textAlign: "center",
  },
  logroDesc: { fontSize: 11, color: "#6B7280", textAlign: "center" },
  logroTextoGris: { color: "#9CA3AF" },
  botonCerrar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  botonCerrarTexto: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E1B4B",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F5F3FF",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1E1B4B",
    marginBottom: 16,
  },
  modalBotones: { flexDirection: "row", gap: 12 },
  botonCancelar: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  botonCancelarTexto: { color: "#6B7280", fontWeight: "600" },
  botonGuardar: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
  },
  botonGuardarTexto: { color: "#fff", fontWeight: "700" },
});
