import { Ionicons } from "@expo/vector-icons";
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
  actualizarEstado,
  obtenerEstadisticas,
  obtenerMisiones,
} from "../../lib/services/misionService";
import { verificarLogros } from "../../lib/services/perfilService";
import { useAuthStore } from "../../store/useAuthStore";

// ── Tipos ───────────────────────────────────────────────────────────────
type Mision = {
  id: number;
  titulo: string;
  descripcion: string;
  xp_recompensa: number;
  monedas_recompensa: number;
  dificultad: "facil" | "media" | "dificil";
  estado: "pendiente" | "en_progreso" | "completada";
  nivel_estres_origen: number;
  completada_at: string | null;
};

type Stats = {
  total_completadas: number;
  total_pendientes: number;
  xp_ganado: number;
  racha_actual: number;
};

// ── Helpers ─────────────────────────────────────────────────────────────
const CATEGORIA_COLORS: Record<string, string> = {
  facil: "#10B981", // verde
  media: "#F59E0B", // naranja
  dificil: "#EF4444", // rojo
};

const DIFICULTAD_LABEL: Record<string, string> = {
  facil: "Fácil",
  media: "Media",
  dificil: "Difícil",
};

const FILTROS_UI = [
  { key: "todas", label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "en_progreso", label: "En progreso" },
  { key: "completada", label: "Completadas" },
] as const;

export default function MisionesScreen() {
  const { user } = useAuthStore();
  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<
    "todas" | "pendiente" | "en_progreso" | "completada"
  >("todas");
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [misionesRes, statsRes] = await Promise.all([
        obtenerMisiones(),
        obtenerEstadisticas(),
      ]);
      setMisiones(misionesRes.misiones ?? []);
      setStats(statsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleCambiarEstado = async (mision: Mision) => {
    if (mision.estado === "completada") return;

    // Flujo web: pendiente -> en_progreso -> completada
    const nuevoEstado =
      mision.estado === "pendiente" ? "en_progreso" : "completada";

    setProcesandoId(mision.id);

    try {
      const res = await actualizarEstado(mision.id, nuevoEstado);

      // 1. Actualizar la misión en la lista local
      setMisiones((prev) =>
        prev.map((m) =>
          m.id === mision.id ? { ...m, estado: nuevoEstado } : m,
        ),
      );

      // 2. Si se completó, dar recompensas
      if (nuevoEstado === "completada") {
        if (res.usuario && user) {
          useAuthStore.setState({
            user: {
              ...user,
              xp: res.usuario.xp,
              monedas: res.usuario.monedas,
              nivel: res.usuario.nivel,
            },
          });
        }
        await verificarLogros();
        const statsRes = await obtenerEstadisticas();
        setStats(statsRes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcesandoId(null);
    }
  };

  // Filtrado de la lista
  const misionesFiltradas = misiones.filter((m) =>
    filtro === "todas" ? true : m.estado === filtro,
  );

  // Conteos dinámicos para los mini-cuadros (igual que en la web)
  const countPendientes = misiones.filter(
    (m) => m.estado === "pendiente",
  ).length;
  const countProgreso = misiones.filter(
    (m) => m.estado === "en_progreso",
  ).length;
  const countCompletadas = misiones.filter(
    (m) => m.estado === "completada",
  ).length;

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ══ Header ══ */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Misiones</Text>
        <Text style={styles.subtitulo}>
          Gestiona tus misiones activas y completa las que ya resolviste.
        </Text>
      </View>

      {/* ══ Filtros ══ */}
      <View style={styles.filtrosScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosRow}
        >
          {FILTROS_UI.map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.filtroBtn,
                filtro === f.key && styles.filtroBtnActivo,
              ]}
              onPress={() => setFiltro(f.key as any)}
            >
              <Text
                style={[
                  styles.filtroTexto,
                  filtro === f.key && styles.filtroTextoActivo,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ══ Stats: Mini cuadros (Pendientes, En progreso, Completadas) ══ */}
      <View style={styles.statsGridRow}>
        <View
          style={[
            styles.statMini,
            { backgroundColor: "rgba(124,58,237,0.06)" },
          ]}
        >
          <Text style={[styles.statMiniVal, { color: "#7C3AED" }]}>
            {countPendientes}
          </Text>
          <Text style={styles.statMiniLbl}>Pendientes</Text>
        </View>

        <View
          style={[
            styles.statMini,
            { backgroundColor: "rgba(245,158,11,0.06)" },
          ]}
        >
          <Text style={[styles.statMiniVal, { color: "#F59E0B" }]}>
            {countProgreso}
          </Text>
          <Text style={styles.statMiniLbl}>En progreso</Text>
        </View>

        <View
          style={[
            styles.statMini,
            { backgroundColor: "rgba(16,185,129,0.06)" },
          ]}
        >
          <Text style={[styles.statMiniVal, { color: "#10B981" }]}>
            {countCompletadas}
          </Text>
          <Text style={styles.statMiniLbl}>Completadas</Text>
        </View>
      </View>

      {/* ══ Lista de misiones ══ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {misionesFiltradas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTexto}>
              No tienes misiones para mostrar con este filtro.
            </Text>
          </View>
        ) : (
          misionesFiltradas.map((mision) => {
            const colorDif = CATEGORIA_COLORS[mision.dificultad];
            const completada = mision.estado === "completada";
            const enProgreso = mision.estado === "en_progreso";
            const procesandoEsta = procesandoId === mision.id;

            return (
              <View
                key={mision.id}
                style={[
                  styles.misionCard,
                  completada && styles.misionCompletada,
                ]}
              >
                {/* Acento lateral por dificultad */}
                <View
                  style={[styles.misionAccent, { backgroundColor: colorDif }]}
                />

                <View style={styles.misionInfo}>
                  <View style={styles.misionHeaderRow}>
                    {/* Badges Web: Dificultad + Estado */}
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colorDif + "20" },
                      ]}
                    >
                      <Text style={[styles.badgeTexto, { color: colorDif }]}>
                        {DIFICULTAD_LABEL[mision.dificultad]}
                      </Text>
                    </View>
                    <View
                      style={[styles.badge, { backgroundColor: "#F3F4F6" }]}
                    >
                      <Text style={[styles.badgeTexto, { color: "#4B5563" }]}>
                        {mision.estado.replace("_", " ")}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.misionTitulo, completada && styles.tachado]}
                  >
                    {mision.titulo}
                  </Text>

                  {mision.descripcion ? (
                    <Text style={styles.misionDesc}>{mision.descripcion}</Text>
                  ) : null}

                  <View style={styles.recompensaRow}>
                    <Text style={styles.misionXP}>
                      +{mision.xp_recompensa} XP
                    </Text>
                    <Text style={{ color: "#D1D5DB" }}>·</Text>
                    <Text style={styles.misionMonedas}>
                      🪙 +{mision.monedas_recompensa}
                    </Text>
                  </View>
                </View>

                {/* ══ Botones de Acción (Estilo Web) ══ */}
                <View style={styles.misionAcciones}>
                  {completada ? (
                    <View style={styles.btnDone}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#059669"
                      />
                      <Text style={styles.btnDoneText}>Completada</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={[
                        styles.btnAction,
                        enProgreso ? styles.btnCompletar : styles.btnIniciar,
                        procesandoEsta && { opacity: 0.6 },
                      ]}
                      onPress={() => handleCambiarEstado(mision)}
                      disabled={procesandoEsta}
                    >
                      {procesandoEsta ? (
                        <ActivityIndicator
                          size="small"
                          color={enProgreso ? "#fff" : "#7C3AED"}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name={enProgreso ? "flag" : "play-circle"}
                            size={16}
                            color={enProgreso ? "#fff" : "#7C3AED"}
                          />
                          <Text
                            style={[
                              styles.btnActionText,
                              { color: enProgreso ? "#fff" : "#7C3AED" },
                            ]}
                          >
                            {enProgreso ? "Completar" : "Iniciar"}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ── Estilos ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
    paddingTop: 48,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    marginBottom: 16,
  },
  titulo: { fontSize: 28, fontWeight: "800", color: "#111827" },
  subtitulo: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },

  // Filtros (Scroll horizontal)
  filtrosScrollWrapper: { marginBottom: 16 },
  filtrosRow: { gap: 8, paddingBottom: 4 },
  filtroBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filtroBtnActivo: { backgroundColor: "#F5F3FF", borderColor: "#7C3AED" },
  filtroTexto: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  filtroTextoActivo: { color: "#7C3AED" },

  // Stats Grid (Pendientes, Progreso, Completadas)
  statsGridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statMini: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statMiniVal: {
    fontSize: 22,
    fontWeight: "bold",
  },
  statMiniLbl: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },

  empty: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#fff",
    padding: 32,
    alignItems: "center",
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTexto: { color: "#9CA3AF", fontSize: 15, textAlign: "center" },

  misionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  misionCompletada: { opacity: 0.6 },
  misionAccent: { width: 6 },
  misionInfo: { flex: 1, padding: 16 },
  misionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTexto: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },

  misionTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  tachado: { textDecorationLine: "line-through", color: "#9CA3AF" },
  misionDesc: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
    lineHeight: 18,
  },

  recompensaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  misionXP: { fontSize: 13, fontWeight: "700", color: "#7C3AED" },
  misionMonedas: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  misionAcciones: {
    paddingRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  // Botones de Acción
  btnAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnIniciar: {
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
  },
  btnCompletar: {
    backgroundColor: "#7C3AED",
  },
  btnActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  btnDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnDoneText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
});
