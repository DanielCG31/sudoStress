import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import {
  actualizarPerfil,
  obtenerHistorialEstres,
  obtenerPerfil,
} from "../../lib/services/perfilService";
import { useAuthStore } from "../../store/useAuthStore";

type Logro = {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  obtenido_at?: string;
};

type Estadisticas = {
  misiones: {
    completadas: number;
    pendientes: number;
    xp_ganado: number;
    racha_dias: number;
  };
  tareas: {
    completadas: number;
    pendientes: number;
  };
  estres: {
    promedio_semana: number;
    total_checkins: number;
  };
};

type GraficaPoint = {
  fecha: string;
  nivel: number;
};

const getColorNivel = (nivel: number) => {
  if (nivel < 3) return "#10B981";
  if (nivel < 5) return "#F59E0B";
  if (nivel < 7) return "#EF4444";
  return "#7C3AED";
};

export default function PerfilScreen() {
  const { user, logout } = useAuthStore();
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [logrosObtenidos, setLogrosObtenidos] = useState<Logro[]>([]);
  const [totalLogros, setTotalLogros] = useState(0);
  const [grafica, setGrafica] = useState<GraficaPoint[]>([]);
  const [promedioEstres, setPromedioEstres] = useState<string>("—");
  const [cargando, setCargando] = useState(true);
  const [modalEditar, setModalEditar] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(user?.name ?? "");
  const [nuevoSemestre, setNuevoSemestre] = useState(user?.semestre ?? "");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const router = useRouter();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [perfilRes, historialRes] = await Promise.all([
        obtenerPerfil(),
        obtenerHistorialEstres(7),
      ]);

      // Actualizar store con datos frescos
      if (perfilRes.perfil) {
        useAuthStore.setState((state) => ({
          user: state.user
            ? {
                ...state.user,
                name: perfilRes.perfil.name,
                semestre: perfilRes.perfil.semestre,
                nivel: perfilRes.perfil.nivel,
                xp: perfilRes.perfil.xp,
                monedas: perfilRes.perfil.monedas,
              }
            : state.user,
        }));
      }

      setEstadisticas(perfilRes.estadisticas);
      setLogrosObtenidos(perfilRes.logros?.obtenidos ?? []);
      setTotalLogros(perfilRes.logros?.total_disponibles ?? 0);

      // Gráfica
      setGrafica(historialRes.grafica ?? []);
      setPromedioEstres(
        historialRes.resumen?.promedio
          ? String(historialRes.resumen.promedio)
          : "—",
      );
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const guardarPerfil = async () => {
    setGuardandoPerfil(true);
    try {
      await actualizarPerfil({
        name: nuevoNombre.trim(),
        semestre: nuevoSemestre.trim(),
      });
      useAuthStore.setState((state) => ({
        user: state.user
          ? {
              ...state.user,
              name: nuevoNombre.trim(),
              semestre: nuevoSemestre.trim(),
            }
          : state.user,
      }));
      setModalEditar(false);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const cerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  // Datos para la gráfica
  const datosGrafica = grafica.map((c) => ({
    value: c.nivel,
    label: c.fecha,
    dataPointColor: getColorNivel(c.nivel),
  }));

  const xpParaSiguienteNivel = user ? user.nivel * 100 : 100;
  const progresoNivel = user ? ((user.xp % 100) / 100) * 100 : 0;

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
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.nombreTexto}>{user?.name || "Sin nombre"}</Text>
          <Text style={styles.semestreTexto}>
            {user?.semestre ? `Semestre ${user.semestre}` : "Sin semestre"}
          </Text>
          <Text style={styles.emailTexto}>🪙 {user?.monedas ?? 0} monedas</Text>
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
          <Text style={styles.cardTitulo}>Nivel {user?.nivel ?? 1}</Text>
          <Text style={styles.xpTexto}>⭐ {user?.xp ?? 0} XP</Text>
        </View>
        <View style={styles.barraFondo}>
          <View
            style={[styles.barraProgreso, { width: `${progresoNivel}%` }]}
          />
        </View>
        <Text style={styles.xpFaltante}>
          {xpParaSiguienteNivel - (user?.xp ?? 0)} XP para el siguiente nivel
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>
            {estadisticas?.misiones.completadas ?? 0}
          </Text>
          <Text style={styles.statLabel}>Misiones{"\n"}completadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>
            {estadisticas?.tareas.completadas ?? 0}
          </Text>
          <Text style={styles.statLabel}>Tareas{"\n"}completadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>
            {estadisticas?.misiones.racha_dias ?? 0}
          </Text>
          <Text style={styles.statLabel}>Días de{"\n"}racha 🔥</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>{promedioEstres}</Text>
          <Text style={styles.statLabel}>Promedio{"\n"}de estrés</Text>
        </View>
      </View>

      {/* Gráfica de estrés */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>📊 Estrés últimos 7 días</Text>
        {datosGrafica.length === 0 ? (
          <View style={styles.graficaVacia}>
            <Text style={styles.graficaVaciaTexto}>
              Haz tu primer check-in para ver la gráfica 📈
            </Text>
          </View>
        ) : (
          <LineChart
            data={datosGrafica}
            height={120}
            spacing={44}
            color="#7C3AED"
            thickness={2}
            startFillColor="#EDE9FE"
            endFillColor="#F5F3FF"
            areaChart
            hideDataPoints={false}
            dataPointsColor="#7C3AED"
            maxValue={10}
            noOfSections={5}
            yAxisTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
            xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
            hideRules={false}
            rulesColor="#F3F4F6"
          />
        )}
      </View>

      {/* Historial de checkins */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>📅 Historial de check-ins</Text>
        {grafica.length === 0 ? (
          <Text style={styles.sinDatos}>Sin check-ins registrados aún</Text>
        ) : (
          grafica.map((c, i) => {
            const color = getColorNivel(c.nivel);
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
                    Nivel {c.nivel}/10
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Logros */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>
          🏆 Logros ({logrosObtenidos.length}/{totalLogros})
        </Text>
        <View style={styles.logrosGrid}>
          {logrosObtenidos.map((logro) => (
            <View key={logro.id} style={styles.logroCard}>
              <Text style={styles.logroEmoji}>{logro.icono}</Text>
              <Text style={styles.logroTitulo}>{logro.nombre}</Text>
              <Text style={styles.logroDesc}>{logro.descripcion}</Text>
            </View>
          ))}
          {/* Mostrar cuántos faltan */}
          {totalLogros - logrosObtenidos.length > 0 && (
            <View style={[styles.logroCard, styles.logroBloqueado]}>
              <Text style={styles.logroEmoji}>🔒</Text>
              <Text style={[styles.logroTitulo, styles.logroTextoGris]}>
                +{totalLogros - logrosObtenidos.length} por desbloquear
              </Text>
              <Text style={[styles.logroDesc, styles.logroTextoGris]}>
                Sigue completando misiones
              </Text>
            </View>
          )}
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
              <Pressable
                style={[
                  styles.botonGuardar,
                  guardandoPerfil && { opacity: 0.6 },
                ]}
                onPress={guardarPerfil}
                disabled={guardandoPerfil}
              >
                <Text style={styles.botonGuardarTexto}>
                  {guardandoPerfil ? "Guardando..." : "Guardar"}
                </Text>
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
