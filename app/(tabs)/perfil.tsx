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
import {
  actualizarPerfil,
  obtenerHistorialEstres,
  obtenerPerfil,
} from "../../lib/services/perfilService";
import { useAuthStore } from "../../store/useAuthStore";

// ── Tipos ───────────────────────────────────────────────────────────────
type Logro = {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  xp_recompensa?: number;
  obtenido_at?: string;
};

type Estadisticas = {
  misiones: {
    completadas: number;
    pendientes: number;
    xp_ganado: number;
    racha_dias: number;
    por_dificultad?: { facil: number; media: number; dificil: number };
  };
  tareas: {
    completadas: number;
    pendientes: number;
    vencidas: number;
    por_categoria?: {
      escolar: number;
      personal: number;
      salud: number;
      otro: number;
    };
  };
  estres: {
    promedio_semana: number;
    total_checkins: number;
  };
};

type GraficaPoint = {
  fecha: string;
  nivel: number | null;
};

// ── Helpers ─────────────────────────────────────────────────────────────
const getColorNivel = (nivel: number | null) => {
  if (nivel === null || typeof nivel === "undefined") return "#E5E7EB";
  if (nivel < 3) return "#10B981"; // Mint
  if (nivel < 6) return "#F59E0B"; // Amber
  if (nivel < 8) return "#F97316"; // Orange
  return "#EF4444"; // Rose
};

export default function PerfilScreen() {
  const { user, logout } = useAuthStore();
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [logrosObtenidos, setLogrosObtenidos] = useState<Logro[]>([]);
  const [totalLogros, setTotalLogros] = useState(0);
  const [grafica, setGrafica] = useState<GraficaPoint[]>([]);
  const [promedioEstres, setPromedioEstres] = useState<string>("—");
  const [totalCheckins7Dias, setTotalCheckins7Dias] = useState(0);
  const [cargando, setCargando] = useState(true);

  // Modales y Tabs
  const [tabActiva, setTabActiva] = useState<
    "historial" | "logros" | "estadisticas"
  >("historial");
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
      setTotalLogros(perfilRes.logros?.total_disponibles ?? 12);

      setGrafica(historialRes.grafica ?? []);
      setPromedioEstres(
        historialRes.resumen?.promedio
          ? String(historialRes.resumen.promedio)
          : "—",
      );
      setTotalCheckins7Dias(historialRes.resumen?.total ?? 0);
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

  // --- Progreso de la barra de nivel ---
  const xpParaSiguienteNivel = user ? user.nivel * 100 : 100;
  const progresoCalculado = user ? (user.xp / xpParaSiguienteNivel) * 100 : 0;
  const progresoNivel = Math.min(100, Math.max(0, progresoCalculado));
  const rachaActual = estadisticas?.misiones?.racha_dias ?? 0;

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
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Mi perfil</Text>

      {/* ══ Header Perfil (bg-ink) ══ */}
      <View style={styles.headerDark}>
        <View style={styles.headerRow}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </Text>
            <View style={styles.avatarBadge}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.nombreTexto}>{user?.name || "Sin nombre"}</Text>
            <Text style={styles.subTexto}>{user?.email}</Text>
            <Text style={styles.subTexto}>
              {user?.semestre ? `${user.semestre}° Semestre` : "Sin semestre"}
            </Text>
          </View>
          <Pressable
            onPress={() => setModalEditar(true)}
            style={styles.editBtn}
          >
            <Ionicons name="pencil" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.tagsRow}>
          <View
            style={[styles.tag, { backgroundColor: "rgba(124,58,237,0.3)" }]}
          >
            <Text style={[styles.tagText, { color: "#DDD6FE" }]}>
              Nivel {user?.nivel ?? 1}
            </Text>
          </View>
          <View
            style={[styles.tag, { backgroundColor: "rgba(245,158,11,0.2)" }]}
          >
            <Text style={[styles.tagText, { color: "#FBBF24" }]}>
              🪙 {user?.monedas ?? 0} monedas
            </Text>
          </View>
          <View
            style={[styles.tag, { backgroundColor: "rgba(239,68,68,0.2)" }]}
          >
            <Text style={[styles.tagText, { color: "#F87171" }]}>
              🔥 Racha {rachaActual} días
            </Text>
          </View>
        </View>
      </View>

      {/* ══ Progreso y Nivel ══ */}
      <View style={styles.card}>
        <View style={styles.nivelRow}>
          <Text style={styles.cardTitulo}>
            <Ionicons name="star" size={18} color="#7C3AED" /> Progreso de nivel
          </Text>
          <Text style={styles.nivelPasoText}>
            Nivel {user?.nivel} → {user?.nivel! + 1}
          </Text>
        </View>

        <View style={styles.barraFondo}>
          <View
            style={[styles.barraProgreso, { width: `${progresoNivel}%` }]}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Text style={styles.xpTexto}>
            {user?.xp} / {xpParaSiguienteNivel} XP
          </Text>
        </View>

        {/* Stats Grid Mini */}
        <View style={styles.statsMiniGrid}>
          <View
            style={[
              styles.statMiniCard,
              { backgroundColor: "rgba(124,58,237,0.05)" },
            ]}
          >
            <Text style={[styles.statMiniNum, { color: "#7C3AED" }]}>
              {user?.xp}
            </Text>
            <Text style={styles.statMiniLabel}>XP total</Text>
          </View>
          <View
            style={[
              styles.statMiniCard,
              { backgroundColor: "rgba(245,158,11,0.05)" },
            ]}
          >
            <Text style={[styles.statMiniNum, { color: "#F59E0B" }]}>
              {user?.monedas}
            </Text>
            <Text style={styles.statMiniLabel}>🪙 Monedas</Text>
          </View>
          <View
            style={[
              styles.statMiniCard,
              { backgroundColor: "rgba(16,185,129,0.05)" },
            ]}
          >
            <Text style={[styles.statMiniNum, { color: "#10B981" }]}>
              {estadisticas?.misiones?.completadas ?? 0}
            </Text>
            <Text style={styles.statMiniLabel}>Misiones</Text>
          </View>
          <View
            style={[
              styles.statMiniCard,
              { backgroundColor: "rgba(239,68,68,0.05)" },
            ]}
          >
            <Text style={[styles.statMiniNum, { color: "#EF4444" }]}>
              {estadisticas?.tareas?.completadas ?? 0}
            </Text>
            <Text style={styles.statMiniLabel}>Tareas</Text>
          </View>
        </View>
      </View>

      {/* ══ Navegación por Tabs ══ */}
      <View style={styles.cardTabs}>
        <View style={styles.tabNavRow}>
          {(["historial", "logros", "estadisticas"] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tabBtn, tabActiva === t && styles.tabBtnActivo]}
              onPress={() => setTabActiva(t)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tabActiva === t && styles.tabBtnTextActivo,
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* CONTENIDO TABS */}
        <View style={styles.tabContent}>
          {/* TAB: HISTORIAL DE ESTRÉS */}
          {tabActiva === "historial" && (
            <View>
              {/* Promedio General */}
              <View style={styles.promedioBox}>
                <Ionicons name="trending-up" size={24} color="#7C3AED" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.promedioText}>
                    Promedio semanal:{" "}
                    <Text style={{ color: "#7C3AED" }}>
                      {promedioEstres} / 10
                    </Text>
                  </Text>
                  <Text style={styles.promedioSub}>
                    {totalCheckins7Dias} registros en los últimos 7 días
                  </Text>
                </View>
              </View>

              {/* Nueva Gráfica de Barras Dinámica de 7 días */}
              <View style={styles.graficaWrap}>
                {Array.from({ length: 7 }).map((_, i) => {
                  // 1. Calculamos los últimos 7 días dinámicamente
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));

                  // 2. Formateamos la fecha a "dd/mm"
                  const diaStr = d.getDate().toString().padStart(2, "0");
                  const mesStr = (d.getMonth() + 1).toString().padStart(2, "0");
                  const fechaFormat = `${diaStr}/${mesStr}`;

                  // 3. Buscamos si hay un check-in guardado para este día.
                  // Aceptamos puntos que vengan como 'dd/mm' o como fecha ISO.
                  const checkin = grafica.find((g) => {
                    if (!g?.fecha) return false;
                    // Si ya viene en formato dd/mm exacto
                    if (/^\d{2}\/\d{2}$/.test(g.fecha))
                      return g.fecha === fechaFormat;
                    // Intentar parsear como ISO/fecha completa
                    const parsed = new Date(g.fecha);
                    if (!isNaN(parsed.getTime())) {
                      const dd = parsed.getDate().toString().padStart(2, "0");
                      const mm = (parsed.getMonth() + 1)
                        .toString()
                        .padStart(2, "0");
                      return `${dd}/${mm}` === fechaFormat;
                    }
                    return false;
                  });
                  const nivel = checkin ? checkin.nivel : null;

                  // 4. Sacamos las etiquetas correctas (D, L, M...)
                  const esHoy = i === 6;
                  const dias = ["D", "L", "M", "Mi", "J", "V", "S"];
                  const label = esHoy ? "Hoy" : dias[d.getDay()];

                  // 5. Altura y color
                  const height = nivel === null ? 8 : (nivel / 10) * 100;
                  const color =
                    nivel === null ? "#E5E7EB" : getColorNivel(nivel);

                  return (
                    <View key={i} style={styles.barCol}>
                      <Text
                        style={[
                          styles.barValor,
                          esHoy && { color: "#7C3AED", fontWeight: "700" },
                        ]}
                      >
                        {nivel ?? "-"}
                      </Text>
                      <View style={styles.barStage}>
                        <View
                          style={[
                            styles.bar,
                            { height: `${height}%`, backgroundColor: color },
                            esHoy && styles.barHoy,
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.barLabel, esHoy && styles.barLabelHoy]}
                      >
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Leyenda de la gráfica */}
              <View style={styles.leyendaRow}>
                <View style={styles.leyendaItem}>
                  <View
                    style={[styles.leyendaDot, { backgroundColor: "#10B981" }]}
                  />
                  <Text style={styles.leyendaTexto}>Bajo (1-2)</Text>
                </View>
                <View style={styles.leyendaItem}>
                  <View
                    style={[styles.leyendaDot, { backgroundColor: "#F59E0B" }]}
                  />
                  <Text style={styles.leyendaTexto}>Medio (3-5)</Text>
                </View>
                <View style={styles.leyendaItem}>
                  <View
                    style={[styles.leyendaDot, { backgroundColor: "#EF4444" }]}
                  />
                  <Text style={styles.leyendaTexto}>Alto (6-10)</Text>
                </View>
              </View>

              {/* Separador visual */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#F3F4F6",
                  marginVertical: 20,
                }}
              />

              {/* Lista de checkins histórica */}
              {grafica.length > 0 ? (
                grafica.map((c, i) => (
                  <View key={i} style={styles.checkinItem}>
                    <View
                      style={[
                        styles.checkinCubo,
                        { backgroundColor: getColorNivel(c.nivel) + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.checkinCuboText,
                          { color: getColorNivel(c.nivel) },
                        ]}
                      >
                        {c.nivel ?? "-"}
                      </Text>
                    </View>
                    <Text style={styles.checkinFecha}>{c.fecha}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  Aún no hay check-ins registrados.
                </Text>
              )}
            </View>
          )}

          {/* TAB: LOGROS */}
          {tabActiva === "logros" && (
            <View>
              <Text style={styles.logrosHeader}>
                <Text style={{ color: "#7C3AED", fontWeight: "bold" }}>
                  {logrosObtenidos.length}
                </Text>{" "}
                de {totalLogros} logros desbloqueados
              </Text>
              <View style={styles.logrosGrid}>
                {logrosObtenidos.map((logro) => (
                  <View key={logro.id} style={styles.logroCard}>
                    <Text style={styles.logroEmoji}>{logro.icono}</Text>
                    <Text style={styles.logroTitulo}>{logro.nombre}</Text>
                    <Text style={styles.logroDesc}>{logro.descripcion}</Text>
                    {logro.xp_recompensa && (
                      <Text style={styles.logroXP}>
                        +{logro.xp_recompensa} XP
                      </Text>
                    )}
                  </View>
                ))}
                {/* Logros Bloqueados Placeholder */}
                {totalLogros - logrosObtenidos.length > 0 && (
                  <View style={[styles.logroCard, styles.logroBloqueado]}>
                    <Text style={styles.logroEmoji}>🔒</Text>
                    <Text style={[styles.logroTitulo, { color: "#9CA3AF" }]}>
                      +{totalLogros - logrosObtenidos.length} por desbloquear
                    </Text>
                    <Text style={styles.logroDesc}>
                      Sigue completando misiones
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB: ESTADÍSTICAS DETALLADAS */}
          {tabActiva === "estadisticas" && (
            <View style={{ gap: 16 }}>
              {/* Misiones Stat */}
              <View
                style={[
                  styles.statDetailBox,
                  { backgroundColor: "rgba(124,58,237,0.05)" },
                ]}
              >
                <Text style={styles.statDetailTitle}>
                  <Ionicons name="flash" size={16} color="#7C3AED" /> Misiones
                </Text>
                <View style={styles.statDetailRow}>
                  <Text style={styles.statDetailL}>Completadas</Text>
                  <Text style={[styles.statDetailR, { color: "#10B981" }]}>
                    {estadisticas?.misiones.completadas}
                  </Text>
                </View>
                <View style={styles.statDetailRow}>
                  <Text style={styles.statDetailL}>Pendientes</Text>
                  <Text style={[styles.statDetailR, { color: "#F59E0B" }]}>
                    {estadisticas?.misiones.pendientes}
                  </Text>
                </View>
                <View style={styles.statDetailRow}>
                  <Text style={styles.statDetailL}>Racha actual</Text>
                  <Text style={[styles.statDetailR, { color: "#EF4444" }]}>
                    🔥 {estadisticas?.misiones.racha_dias} días
                  </Text>
                </View>
              </View>

              {/* Tareas Stat */}
              <View
                style={[
                  styles.statDetailBox,
                  { backgroundColor: "rgba(16,185,129,0.05)" },
                ]}
              >
                <Text style={styles.statDetailTitle}>
                  <Ionicons name="calendar" size={16} color="#10B981" /> Agenda
                </Text>
                <View style={styles.statDetailRow}>
                  <Text style={styles.statDetailL}>Completadas</Text>
                  <Text style={[styles.statDetailR, { color: "#10B981" }]}>
                    {estadisticas?.tareas.completadas}
                  </Text>
                </View>
                <View style={styles.statDetailRow}>
                  <Text style={styles.statDetailL}>Pendientes</Text>
                  <Text style={[styles.statDetailR, { color: "#F59E0B" }]}>
                    {estadisticas?.tareas.pendientes}
                  </Text>
                </View>
                <View style={styles.statDetailRow}>
                  <Text style={styles.statDetailL}>Vencidas</Text>
                  <Text style={[styles.statDetailR, { color: "#EF4444" }]}>
                    {estadisticas?.tareas.vencidas}
                  </Text>
                </View>
              </View>

              {/* Bienestar Stat */}
              <View
                style={[
                  styles.statDetailBox,
                  { backgroundColor: "rgba(239,68,68,0.05)" },
                ]}
              >
                <Text style={styles.statDetailTitle}>
                  <Ionicons name="happy" size={16} color="#EF4444" /> Bienestar
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    marginTop: 10,
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Text style={[styles.statMiniNum, { color: "#EF4444" }]}>
                      {promedioEstres}
                    </Text>
                    <Text
                      style={[styles.statMiniLabel, { textAlign: "center" }]}
                    >
                      Promedio{"\n"}semana
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={[styles.statMiniNum, { color: "#10B981" }]}>
                      {totalCheckins7Dias}
                    </Text>
                    <Text
                      style={[styles.statMiniLabel, { textAlign: "center" }]}
                    >
                      Total{"\n"}registros
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ══ Zona Peligrosa (Cuenta) ══ */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>
          <Ionicons name="settings" size={18} color="#9CA3AF" /> Cuenta
        </Text>
        <Pressable style={styles.botonCerrar} onPress={cerrarSesion}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.botonCerrarTexto}>Cerrar sesión</Text>
        </Pressable>
      </View>

      {/* ══ Modal editar perfil ══ */}
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
                  {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── Estilos ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
    paddingTop: 5,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },

  // Header bg-ink
  headerDark: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatarWrap: { position: "relative", marginRight: 16 },
  avatarText: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 64,
    overflow: "hidden",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#10B981",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1 },
  nombreTexto: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subTexto: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 2 },
  editBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 12,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: "700" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },

  // Nivel
  nivelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nivelPasoText: { fontSize: 13, color: "#9CA3AF" },
  barraFondo: {
    height: 12,
    backgroundColor: "rgba(124,58,237,0.1)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 6,
  },
  barraProgreso: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 6,
  },
  xpTexto: { fontSize: 12, color: "#9CA3AF" },

  // Grid mini stats
  statsMiniGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statMiniCard: {
    flex: 1,
    minWidth: "22%",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  statMiniNum: { fontSize: 20, fontWeight: "bold" },
  statMiniLabel: { fontSize: 11, color: "#6B7280", marginTop: 4 },

  // Tabs
  cardTabs: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  tabNavRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActivo: { borderBottomColor: "#7C3AED" },
  tabBtnText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  tabBtnTextActivo: { color: "#7C3AED" },
  tabContent: { padding: 20 },

  // Tab: Historial
  promedioBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,58,237,0.05)",
    padding: 12,
    borderRadius: 12,
    marginVertical: 16,
  },
  promedioText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  promedioSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  checkinItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  checkinCubo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkinCuboText: { fontSize: 14, fontWeight: "bold" },
  checkinFecha: { fontSize: 14, color: "#4B5563", fontWeight: "500" },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },

  // --- Estilos para la Nueva Gráfica de Barras ---
  graficaWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 150,
    gap: 8,
    marginTop: 10,
  },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barValor: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  barStage: { width: "100%", flex: 1, justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 6, minHeight: 8 },
  barHoy: { borderWidth: 2, borderColor: "#7C3AED" },
  barLabel: { fontSize: 11, color: "#9CA3AF" },
  barLabelHoy: { color: "#7C3AED", fontWeight: "700" },

  // --- Estilos para la leyenda ---
  leyendaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 20,
    justifyContent: "center",
  },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  leyendaDot: { width: 10, height: 10, borderRadius: 3 },
  leyendaTexto: { fontSize: 12, color: "#6B7280", fontWeight: "500" },

  // Tab: Logros
  logrosHeader: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  logrosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  logroCard: {
    width: "48%",
    backgroundColor: "rgba(124,58,237,0.05)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  logroBloqueado: { backgroundColor: "#F9FAFB", borderColor: "#F3F4F6" },
  logroEmoji: { fontSize: 32, marginBottom: 8 },
  logroTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  logroDesc: { fontSize: 11, color: "#6B7280", textAlign: "center" },
  logroXP: { fontSize: 11, color: "#7C3AED", fontWeight: "700", marginTop: 6 },

  // Tab: Estadisticas
  statDetailBox: { borderRadius: 16, padding: 16 },
  statDetailTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  statDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statDetailL: { fontSize: 13, color: "#6B7280" },
  statDetailR: { fontSize: 14, fontWeight: "bold", color: "#111827" },

  // Zona peligrosa
  botonCerrar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.05)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 14,
    padding: 14,
  },
  botonCerrarTexto: { color: "#EF4444", fontWeight: "700", fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 16,
  },
  modalBotones: { flexDirection: "row", gap: 12, marginTop: 10 },
  botonCancelar: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  botonCancelarTexto: { color: "#4B5563", fontWeight: "700", fontSize: 15 },
  botonGuardar: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
  },
  botonGuardarTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
