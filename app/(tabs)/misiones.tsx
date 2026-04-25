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

const CATEGORIA_COLORS: Record<string, string> = {
  facil: "#10B981",
  media: "#F59E0B",
  dificil: "#EF4444",
};

const DIFICULTAD_LABEL: Record<string, string> = {
  facil: "Fácil",
  media: "Media",
  dificil: "Difícil",
};

export default function MisionesScreen() {
  const { user } = useAuthStore();
  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<"pendientes" | "completadas">("pendientes");
  const [completando, setCompletando] = useState<number | null>(null);

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

  const completarMision = async (mision: Mision) => {
    if (mision.estado === "completada") return;
    setCompletando(mision.id);

    try {
      const res = await actualizarEstado(mision.id, "completada");

      // Actualizar misión en la lista
      setMisiones((prev) =>
        prev.map((m) =>
          m.id === mision.id ? { ...m, estado: "completada" } : m,
        ),
      );

      // Actualizar XP y monedas en el store
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

      // Verificar logros nuevos
      await verificarLogros();

      // Recargar stats
      const statsRes = await obtenerEstadisticas();
      setStats(statsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setCompletando(null);
    }
  };

  const misionesFiltradas = misiones.filter((m) =>
    tab === "pendientes"
      ? m.estado !== "completada"
      : m.estado === "completada",
  );

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Misiones ⚔️</Text>
      </View>

      {/* Card XP + stats */}
      <View style={styles.xpCard}>
        <View>
          <Text style={styles.xpLabel}>XP Total ganado</Text>
          <Text style={styles.xpValor}>⭐ {stats?.xp_ganado ?? 0} XP</Text>
        </View>
        <View style={styles.xpStats}>
          <Text style={styles.xpStatTexto}>
            ✅ {stats?.total_completadas ?? 0} completadas
          </Text>
          <Text style={styles.xpStatTexto}>
            🔥 Racha: {stats?.racha_actual ?? 0} días
          </Text>
          <Text style={styles.xpStatTexto}>
            ⏳ {stats?.total_pendientes ?? 0} pendientes
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(["pendientes", "completadas"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActivo]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabTexto, tab === t && styles.tabTextoActivo]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Lista de misiones */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {misionesFiltradas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              {tab === "pendientes" ? "🎯" : "🏆"}
            </Text>
            <Text style={styles.emptyTexto}>
              {tab === "pendientes"
                ? "No tienes misiones pendientes\nHaz un check-in para recibir nuevas"
                : "Aún no completas ninguna misión"}
            </Text>
          </View>
        ) : (
          misionesFiltradas.map((mision) => {
            const color = CATEGORIA_COLORS[mision.dificultad];
            const completada = mision.estado === "completada";
            const cargandoEsta = completando === mision.id;

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
                  style={[styles.misionAccent, { backgroundColor: color }]}
                />

                <View style={styles.misionInfo}>
                  <View style={styles.misionHeaderRow}>
                    <Text
                      style={[
                        styles.misionTitulo,
                        completada && styles.tachado,
                      ]}
                    >
                      {mision.titulo}
                    </Text>
                    <View
                      style={[
                        styles.dificultadBadge,
                        { backgroundColor: color + "20" },
                      ]}
                    >
                      <Text style={[styles.dificultadTexto, { color }]}>
                        {DIFICULTAD_LABEL[mision.dificultad]}
                      </Text>
                    </View>
                  </View>

                  {mision.descripcion ? (
                    <Text style={styles.misionDesc}>{mision.descripcion}</Text>
                  ) : null}

                  <View style={styles.recompensaRow}>
                    <Text style={[styles.misionXP, { color }]}>
                      +{mision.xp_recompensa} XP
                    </Text>
                    <Text style={styles.misionMonedas}>
                      🪙 +{mision.monedas_recompensa}
                    </Text>
                    {mision.nivel_estres_origen && (
                      <Text style={styles.estresBadge}>
                        Estrés {mision.nivel_estres_origen}/10
                      </Text>
                    )}
                  </View>
                </View>

                {/* Acción */}
                <View style={styles.misionAcciones}>
                  {completada ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={30}
                      color="#10B981"
                    />
                  ) : (
                    <Pressable
                      style={[
                        styles.botonCompletar,
                        { backgroundColor: color + "20" },
                      ]}
                      onPress={() => completarMision(mision)}
                      disabled={cargandoEsta}
                    >
                      {cargandoEsta ? (
                        <ActivityIndicator size="small" color={color} />
                      ) : (
                        <Ionicons name="checkmark" size={22} color={color} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3FF",
    padding: 16,
    paddingTop: 48,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#1E1B4B" },
  xpCard: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xpLabel: { color: "#DDD6FE", fontSize: 12, marginBottom: 4 },
  xpValor: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  xpStats: { gap: 4 },
  xpStatTexto: { color: "#DDD6FE", fontSize: 12 },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActivo: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabTexto: { color: "#9CA3AF", fontWeight: "600", fontSize: 14 },
  tabTextoActivo: { color: "#7C3AED" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTexto: {
    color: "#9CA3AF",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  misionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  misionCompletada: { opacity: 0.6 },
  misionAccent: { width: 5 },
  misionInfo: { flex: 1, padding: 14 },
  misionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  misionTitulo: { fontSize: 15, fontWeight: "600", color: "#1E1B4B", flex: 1 },
  tachado: { textDecorationLine: "line-through", color: "#9CA3AF" },
  dificultadBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dificultadTexto: { fontSize: 10, fontWeight: "700" },
  misionDesc: { fontSize: 12, color: "#9CA3AF", marginBottom: 6 },
  recompensaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  misionXP: { fontSize: 13, fontWeight: "700" },
  misionMonedas: { fontSize: 12, color: "#6B7280" },
  estresBadge: {
    fontSize: 10,
    color: "#9CA3AF",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  misionAcciones: {
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  botonCompletar: { borderRadius: 10, padding: 8 },
});
