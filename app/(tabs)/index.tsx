import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  checkinHoy,
  obtenerUltimoConsejo,
  registrarCheckin,
} from "../../lib/services/checkinService";
import { obtenerMisiones } from "../../lib/services/misionService";
import { obtenerHistorialEstres } from "../../lib/services/perfilService";
import { obtenerTareas } from "../../lib/services/tareaService";
import { useAuthStore } from "../../store/useAuthStore";

const getEstres = (nivel: number) => {
  if (nivel <= 2)
    return { emoji: "😄", label: "Muy tranquilo", color: "#34d399" };
  if (nivel <= 4) return { emoji: "🙂", label: "Tranquilo", color: "#34d399" };
  if (nivel <= 6)
    return { emoji: "😐", label: "Algo estresado", color: "#fbbf24" };
  if (nivel <= 8) return { emoji: "😟", label: "Estresado", color: "#f97316" };
  return { emoji: "😰", label: "Muy estresado", color: "#f87171" };
};

const getBarColor = (nivel: number | null) => {
  if (nivel === null) return "#e5e7eb";
  if (nivel <= 3) return "#34d399";
  if (nivel <= 6) return "#fbbf24";
  return "#f87171";
};

const getDiasInfo = (fecha: string | null) => {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const entrega = new Date(fecha);
  entrega.setHours(0, 0, 0, 0);
  const dias = Math.ceil((entrega.getTime() - hoy.getTime()) / 86400000);
  if (dias < 0)
    return { label: "¡Atrasado!", color: "#f87171", bar: "#f87171" };
  if (dias === 0) return { label: "¡Hoy!", color: "#f87171", bar: "#f87171" };
  if (dias === 1)
    return { label: "¡Mañana!", color: "#f87171", bar: "#f87171" };
  if (dias <= 3)
    return { label: `En ${dias} días`, color: "#fbbf24", bar: "#fbbf24" };
  return { label: `En ${dias} días`, color: "#34d399", bar: "#a78bfa" };
};

// ── Tipos ────────────────────────────────────────────────────────────────────
type Tarea = {
  id: number;
  titulo: string;
  fecha_limite: string | null;
  estado: string;
};
type CheckinData = { id: number; nivel_estres: number } | null;
type Mision = { titulo: string; xp_recompensa: number; dificultad?: string };
type GraficaPoint = { fecha: string; nivel: number | null };
type ConsejoApi = { contenido: string } | null;

const extraerContenidoConsejo = (consejo: ConsejoApi | string | undefined) => {
  if (!consejo) return null;
  if (typeof consejo === "string") return consejo;
  return consejo.contenido;
};

// ── Componente ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [nivelEstres, setNivelEstres] = useState(5);
  const [checkinData, setCheckinData] = useState<CheckinData>(null);
  const [tareasPendientes, setTareasPendientes] = useState<Tarea[]>([]);
  const [misionesIA, setMisionesIA] = useState<Mision[]>([]);
  const [consejoIA, setConsejoIA] = useState<string | null>(null);
  const [grafica, setGrafica] = useState<GraficaPoint[]>([]);
  const [promedio, setPromedio] = useState<string>("—");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [comentario, setComentario] = useState("");

  const estadoEstres = getEstres(
    checkinData ? checkinData.nivel_estres : nivelEstres,
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [hoyRes, consejoRes, misionesRes, tareasRes, historialRes] =
        await Promise.all([
          checkinHoy(),
          obtenerUltimoConsejo(),
          obtenerMisiones("pendiente"),
          obtenerTareas({ estado: "pendiente" }),
          obtenerHistorialEstres(7),
        ]);

      if (hoyRes.checkin) {
        setCheckinData(hoyRes.checkin);
        setNivelEstres(hoyRes.checkin.nivel_estres);
      }

      const consejoInicial = extraerContenidoConsejo(consejoRes.consejo);
      if (consejoInicial) setConsejoIA(consejoInicial);

      setMisionesIA(misionesRes.misiones?.slice(0, 3) ?? []);
      setTareasPendientes(tareasRes.tareas?.slice(0, 3) ?? []);

      // Construir los 7 días para la gráfica (igual que la web)
      if (historialRes.grafica) {
        setGrafica(historialRes.grafica);
        setPromedio(historialRes.resumen?.promedio ?? "—");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  const guardarCheckin = async () => {
    setGuardando(true);
    try {
      // 1. Enviamos el comentario (nota) a la API
      const data = await registrarCheckin(
        nivelEstres,
        comentario.trim() || undefined,
      );

      if (data.checkin) setCheckinData(data.checkin);
      if (data.misiones) setMisionesIA(data.misiones.slice(0, 3));
      const consejoNuevo =
        extraerContenidoConsejo(data.consejo) ??
        extraerContenidoConsejo((await obtenerUltimoConsejo()).consejo);
      if (consejoNuevo) setConsejoIA(consejoNuevo);

      // Recargar historial tras el checkin
      const historialRes = await obtenerHistorialEstres(7);
      if (historialRes.grafica) {
        setGrafica(historialRes.grafica);
        setPromedio(historialRes.resumen?.promedio ?? "—");
      }

      setComentario(""); // 2. Limpiamos el comentario
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Animated.ScrollView
      style={[s.container, { opacity: fadeAnim }]}
      contentContainerStyle={{ paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ══ Header ══ */}
      <View style={s.header}>
        <View>
          <Text style={s.saludo}>
            Hola, {user?.name || "estudiante"}{" "}
            <MaterialCommunityIcons
              name="hand-wave"
              size={20}
              color="#1f2937"
            />
          </Text>
          <Text style={s.fecha}>
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        {/* Nivel + Monedas — igual que la web */}
        <View style={s.statsRow}>
          <View style={s.statBadgeViolet}>
            <Text style={s.statBadgeVioletText}>
              ⭐ Nivel {user?.nivel ?? 1}
            </Text>
          </View>
          <View style={s.statBadgeAmber}>
            <Text style={s.statBadgeAmberText}>🪙 {user?.monedas ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* ══ Frase motivacional ══ */}
      {consejoIA ? (
        <View style={s.quoteBanner}>
          <Text style={s.quoteText}>{consejoIA}</Text>
          <Text style={s.quoteDecor}>"</Text>
        </View>
      ) : null}

      {/* ══ Check-in ══ */}
      <View style={s.checkinCard}>
        <View style={s.checkinTopBar} />
        <Text style={s.checkinTitulo}>😊 ¿Cómo te sientes hoy?</Text>

        {checkinData ? (
          <View style={s.checkinDone}>
            <Text style={s.checkinEmoji}>{estadoEstres.emoji}</Text>
            <View>
              <Text style={s.checkinDoneTitle}>Check-in completado hoy ✓</Text>
              <Text style={s.checkinDoneSub}>
                Nivel de estrés:{" "}
                <Text style={{ color: "#7c3aed", fontWeight: "700" }}>
                  {checkinData.nivel_estres}/10
                </Text>
                {"  "}
                <Text style={{ color: "#10b981", fontWeight: "600" }}>
                  +10 XP ganados
                </Text>
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <View style={s.sliderHeader}>
              <Text style={s.sliderSideLabel}>😄 Tranquilo</Text>
              <View style={{ alignItems: "center" }}>
                <Text style={s.sliderEmoji}>{estadoEstres.emoji}</Text>
                <Text style={[s.sliderNivel, { color: estadoEstres.color }]}>
                  {nivelEstres}
                  <Text style={{ fontSize: 15, color: "#9ca3af" }}>/10</Text>
                </Text>
                <Text style={[s.sliderLabel, { color: estadoEstres.color }]}>
                  {estadoEstres.label}
                </Text>
              </View>
              <Text style={s.sliderSideLabel}>😰 Muy estresado</Text>
            </View>

            <Slider
              style={{ width: "100%", height: 36, marginBottom: 2 }}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={nivelEstres}
              onValueChange={setNivelEstres}
              minimumTrackTintColor={estadoEstres.color}
              maximumTrackTintColor="#ede9fe"
              thumbTintColor={estadoEstres.color}
            />
            <View style={s.sliderNumbers}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <Text key={n} style={s.sliderNum}>
                  {n}
                </Text>
              ))}
            </View>

            {/* NUEVO: Campo de comentario corregido y posicionado antes del botón */}
            <TextInput
              style={s.checkinInput}
              value={comentario}
              onChangeText={setComentario}
              placeholder="¿Algo en particular que quieras anotar?"
              multiline
            />

            <Pressable
              style={[
                s.botonCheckin,
                guardando && { opacity: 0.6 },
                { marginTop: 12 },
              ]}
              onPress={guardarCheckin}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.botonTexto}>
                  ✨ Registrar y obtener misiones
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* ══ Grid: Misiones + Tareas ══ */}
      <View style={s.grid}>
        {/* Misiones activas */}
        <Pressable
          style={s.misionesCard}
          onPress={() => router.push("/(tabs)/misiones")}
        >
          <View
            style={[s.cardBubble, { backgroundColor: "rgba(111,63,245,.08)" }]}
          />
          <View style={s.cardHeader}>
            <View style={s.cardIconWrap}>
              <Text>⚡</Text>
            </View>
            <Text style={s.cardTitulo}>Misiones activas</Text>
            <Text style={s.cardLink}>Ver todas →</Text>
          </View>

          {misionesIA.length > 0 ? (
            misionesIA.map((m, i) => (
              <View key={i} style={s.misionRow}>
                <View
                  style={[
                    s.dot,
                    {
                      backgroundColor:
                        m.dificultad === "facil"
                          ? "#34d399"
                          : m.dificultad === "dificil"
                            ? "#f87171"
                            : "#fbbf24",
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.misionTitulo} numberOfLines={1}>
                    {m.titulo}
                  </Text>
                  <Text style={s.misionXP}>
                    +{m.xp_recompensa} XP · 🪙 +
                    {Math.floor(m.xp_recompensa / 2)}
                  </Text>
                </View>
                <View
                  style={[
                    s.tagBadge,
                    {
                      backgroundColor:
                        m.dificultad === "facil"
                          ? "rgba(16,185,129,.12)"
                          : m.dificultad === "dificil"
                            ? "rgba(239,68,68,.12)"
                            : "rgba(245,158,11,.12)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.tagTexto,
                      {
                        color:
                          m.dificultad === "facil"
                            ? "#10b981"
                            : m.dificultad === "dificil"
                              ? "#ef4444"
                              : "#f59e0b",
                      },
                    ]}
                  >
                    {m.dificultad}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🎯</Text>
              <Text style={s.emptyText}>
                Haz tu check-in para recibir{"\n"}misiones personalizadas con IA
              </Text>
            </View>
          )}
        </Pressable>

        {/* Próximas entregas */}
        <Pressable
          style={s.tareasCard}
          onPress={() => router.push("/(tabs)/agenda")}
        >
          <View
            style={[s.cardBubble, { backgroundColor: "rgba(251,146,60,.08)" }]}
          />
          <View style={s.cardHeader}>
            <View style={[s.cardIconWrap, { backgroundColor: "#fff7ed" }]}>
              <Text>📅</Text>
            </View>
            <Text style={s.cardTitulo}>Próximas entregas</Text>
            <Text style={[s.cardLink, { color: "#f97316" }]}>Ver agenda →</Text>
          </View>

          {tareasPendientes.length > 0 ? (
            tareasPendientes.map((t) => {
              const info = getDiasInfo(t.fecha_limite);
              return (
                <View key={t.id} style={s.tareaRow}>
                  <View
                    style={[
                      s.tareaBar,
                      { backgroundColor: info?.bar ?? "#a78bfa" },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.tareaTitulo} numberOfLines={1}>
                      {t.titulo}
                    </Text>
                    {t.fecha_limite && (
                      <Text style={s.tareaFecha}>
                        📆{" "}
                        {new Date(t.fecha_limite).toLocaleDateString("es-MX")}
                        {info && (
                          <Text
                            style={{ color: info.color, fontWeight: "700" }}
                          >
                            {" · "}
                            {info.label}
                          </Text>
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>✅</Text>
              <Text style={s.emptyText}>¡No tienes tareas pendientes! 🎉</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ══ Gráfica de estrés últimos 7 días ══ */}
      <View style={s.estresCard}>
        <View
          style={[
            s.cardBubble,
            {
              backgroundColor: "rgba(52,211,153,.08)",
              bottom: -40,
              right: -40,
              width: 130,
              height: 130,
              borderRadius: 65,
            },
          ]}
        />
        <View style={s.estresHeader}>
          <View style={s.cardHeader}>
            <View style={[s.cardIconWrap, { backgroundColor: "#ecfdf5" }]}>
              <Text>📈</Text>
            </View>
            <Text style={s.cardTitulo}>Estrés — últimos 7 días</Text>
          </View>
          <Text style={s.estresPromedio}>
            Promedio:{" "}
            <Text style={{ color: "#10b981", fontWeight: "700" }}>
              {promedio}
            </Text>
          </Text>
        </View>

        {/* Barras */}
        <View style={s.graficaWrap}>
          {grafica.length > 0
            ? grafica.map((punto, i) => {
                const esHoy = i === grafica.length - 1;
                const nivel =
                  checkinData && esHoy ? checkinData.nivel_estres : punto.nivel;
                const height = nivel === null ? 8 : (nivel / 10) * 100;
                const color = getBarColor(nivel);
                const dias = ["D", "L", "M", "Mi", "J", "V", "S"];
                const label = esHoy
                  ? "Hoy"
                  : punto.fecha
                    ? dias[new Date(punto.fecha).getDay()]
                    : (() => {
                        const today = new Date();
                        // offset from the last element (which is today)
                        const offsetFromToday = grafica.length - 1 - i;
                        const dayIndex =
                          (today.getDay() - offsetFromToday + 7) % 7;
                        return dias[dayIndex];
                      })();

                return (
                  <View key={i} style={s.barCol}>
                    <Text
                      style={[
                        s.barValor,
                        esHoy && { color: "#7c3aed", fontWeight: "700" },
                      ]}
                    >
                      {nivel ?? "-"}
                    </Text>
                    <View style={s.barStage}>
                      <View
                        style={[
                          s.bar,
                          {
                            height: `${height}%` as any,
                            backgroundColor: color,
                          },
                          esHoy && s.barHoy,
                        ]}
                      />
                    </View>
                    <Text style={[s.barLabel, esHoy && s.barLabelHoy]}>
                      {label}
                    </Text>
                  </View>
                );
              })
            : // Placeholder 7 días vacíos si no hay datos
              Array.from({ length: 7 }).map((_, idx) => {
                const dias = ["D", "L", "M", "Mi", "J", "V", "S"];
                const today = new Date();
                const offsetFromToday = 6 - idx; // placeholder: last index = today
                const dayIndex = (today.getDay() - offsetFromToday + 7) % 7;
                const label = idx === 6 ? "Hoy" : dias[dayIndex];
                return (
                  <View key={idx} style={s.barCol}>
                    <Text style={s.barValor}>-</Text>
                    <View style={s.barStage}>
                      <View
                        style={[
                          s.bar,
                          { height: "8%", backgroundColor: "#e5e7eb" },
                        ]}
                      />
                    </View>
                    <Text style={[s.barLabel, idx === 6 && s.barLabelHoy]}>
                      {label}
                    </Text>
                  </View>
                );
              })}
        </View>

        {/* Leyenda */}
        <View style={s.leyendaRow}>
          <View style={s.leyendaItem}>
            <View style={[s.leyendaDot, { backgroundColor: "#34d399" }]} />
            <Text style={s.leyendaTexto}>Bajo (1–4)</Text>
          </View>
          <View style={s.leyendaItem}>
            <View style={[s.leyendaDot, { backgroundColor: "#fbbf24" }]} />
            <Text style={s.leyendaTexto}>Medio (5–7)</Text>
          </View>
          <View style={s.leyendaItem}>
            <View style={[s.leyendaDot, { backgroundColor: "#f87171" }]} />
            <Text style={s.leyendaTexto}>Alto (8–10)</Text>
          </View>
        </View>
      </View>
    </Animated.ScrollView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3ff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header — igual que la web: saludo + badges nivel/monedas
  header: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  saludo: { fontSize: 22, fontWeight: "800", color: "#111827" },
  fecha: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 3,
    textTransform: "capitalize",
  },
  statsRow: { flexDirection: "row", gap: 8, flexShrink: 0 },
  statBadgeViolet: {
    backgroundColor: "#f5f3ff",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  statBadgeVioletText: { fontSize: 13, fontWeight: "700", color: "#7c3aed" },
  statBadgeAmber: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  statBadgeAmberText: { fontSize: 13, fontWeight: "700", color: "#b45309" },

  // Quote
  quoteBanner: {
    backgroundColor: "rgba(111,63,245,.07)",
    borderWidth: 1,
    borderColor: "rgba(111,63,245,.18)",
    borderLeftWidth: 3,
    borderLeftColor: "#7c3aed",
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 44,
    position: "relative",
    overflow: "hidden",
  },
  quoteText: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#6f3ff5",
    fontWeight: "500",
  },
  quoteDecor: {
    position: "absolute",
    right: 6,
    top: -6,
    fontSize: 52,
    color: "rgba(111,63,245,.08)",
    lineHeight: 52,
  },

  // Checkin card
  checkinCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  checkinTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#7c3aed",
  },
  checkinTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 16,
  },
  checkinDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(52,211,153,.08)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,.2)",
    borderRadius: 14,
    padding: 14,
  },
  checkinEmoji: { fontSize: 36 },
  checkinDoneTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937" },
  checkinDoneSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  checkinInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: "#fff",
    color: "#111827",
  },

  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sliderSideLabel: { fontSize: 12, color: "#9ca3af" },
  sliderEmoji: { fontSize: 30 },
  sliderNivel: { fontSize: 26, fontWeight: "900" },
  sliderLabel: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  sliderNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 14,
  },
  sliderNum: { fontSize: 10, color: "#d1d5db" },
  botonCheckin: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  checkinComentarioLabel: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  botonTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Grid
  grid: { paddingHorizontal: 16, gap: 12, marginBottom: 12 },

  // Card base compartido
  misionesCard: {
    backgroundColor: "#faf9ff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(111,63,245,.12)",
    padding: 18,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tareasCard: {
    backgroundColor: "#fffaf9",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(251,146,60,.15)",
    padding: 18,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#f97316",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardBubble: {
    position: "absolute",
    bottom: -28,
    right: -28,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitulo: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", flex: 1 },
  cardLink: { fontSize: 12, fontWeight: "600", color: "#7c3aed" },

  // Mision row
  misionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  misionTitulo: { fontSize: 13, fontWeight: "600", color: "#1f2937" },
  misionXP: { fontSize: 11, fontWeight: "600", color: "#10b981", marginTop: 1 },
  tagBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagTexto: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },

  // Tarea row
  tareaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 2,
  },
  tareaBar: { width: 3, height: 38, borderRadius: 99, flexShrink: 0 },
  tareaTitulo: { fontSize: 13, fontWeight: "600", color: "#1f2937" },
  tareaFecha: { fontSize: 11, color: "#9ca3af", marginTop: 1 },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 20 },
  emptyEmoji: { fontSize: 34, marginBottom: 8 },
  emptyText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
  },

  // Gráfica estrés
  estresCard: {
    backgroundColor: "#f9fffe",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,.15)",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#10b981",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  estresHeader: { marginBottom: 16 },
  estresPromedio: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
    marginLeft: 36,
  },

  graficaWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 110,
    gap: 4,
    marginBottom: 12,
  },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barValor: { fontSize: 10, fontWeight: "600", color: "#6b7280" },
  barStage: { width: "100%", flex: 1, justifyContent: "flex-end" },
  bar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 8,
  },
  barHoy: {
    borderWidth: 2,
    borderColor: "#10b981",
  },
  barLabel: { fontSize: 10, color: "#9ca3af" },
  barLabelHoy: { color: "#7c3aed", fontWeight: "700" },

  leyendaRow: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(52,211,153,.12)",
    flexWrap: "wrap",
  },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  leyendaDot: { width: 10, height: 10, borderRadius: 3 },
  leyendaTexto: { fontSize: 11, color: "#6b7280" },
});
