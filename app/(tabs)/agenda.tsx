import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  actualizarTarea,
  crearTarea,
  eliminarTarea,
  obtenerTareas,
  regenerarRecomendacion, // <-- No olvides agregar este import en tu tareaService.ts
} from "../../lib/services/tareaService";

// ── Tipos ───────────────────────────────────────────────────────────────
type Tarea = {
  id: number;
  titulo: string;
  descripcion?: string;
  categoria: "escolar" | "personal" | "salud" | "otro";
  prioridad: "baja" | "media" | "alta";
  fecha_limite: string | null;
  estado: "pendiente" | "en_progreso" | "completada";
  recomendacion?: {
    pasos: string[];
    consejo: string;
    tiempo_estimado: string | null;
  };
};

type RecomendacionModal = {
  visible: boolean;
  tarea: Tarea | null;
};

// ── Helpers ─────────────────────────────────────────────────────────────
const CATEGORIAS = [
  {
    key: "escolar",
    label: "Escolar",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.1)",
  },
  {
    key: "personal",
    label: "Personal",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.1)",
  },
  {
    key: "salud",
    label: "Salud",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
  },
  { key: "otro", label: "Otro", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
];
const FILTROS_UI = [
  { key: "todas", label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "en_progreso", label: "En progreso" },
  { key: "completada", label: "Completadas" },
] as const;

const PRIORIDADES = [
  { key: "baja", label: "Baja" },
  { key: "media", label: "Media" },
  { key: "alta", label: "Alta" },
];

const getCategoriaInfo = (cat: string) =>
  CATEGORIAS.find((c) => c.key === cat) ?? CATEGORIAS[3];

const getEstadoEstilos = (estado: string) => {
  switch (estado) {
    case "pendiente":
      return { color: "#4B5563", bg: "#F3F4F6", label: "Pendiente" };
    case "en_progreso":
      return { color: "#D97706", bg: "#FEF3C7", label: "En progreso" };
    case "completada":
      return { color: "#059669", bg: "#D1FAE5", label: "Completada" };
    default:
      return { color: "#4B5563", bg: "#F3F4F6", label: estado };
  }
};

const parseFechaLimite = (fechaLimite: string | null) => {
  if (!fechaLimite) return null;

  const isoMatch = fechaLimite.match(/^(\d{4}-\d{2}-\d{2})/);
  const baseFecha = isoMatch ? `${isoMatch[1]}T12:00:00` : fechaLimite;
  const fechaParseada = new Date(baseFecha);

  return Number.isNaN(fechaParseada.getTime()) ? null : fechaParseada;
};

export default function AgendaScreen() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modales
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [recomendacionModal, setRecomendacionModal] =
    useState<RecomendacionModal>({ visible: false, tarea: null });
  const [mostrarFecha, setMostrarFecha] = useState(false);

  // Formulario nueva/editar tarea
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<Tarea["categoria"]>("escolar");
  const [prioridad, setPrioridad] = useState<Tarea["prioridad"]>("media");
  const [fecha, setFecha] = useState(new Date());
  const [guardando, setGuardando] = useState(false);
  const [recalculandoIA, setRecalculandoIA] = useState(false);

  // Filtros
  const [filtro, setFiltro] = useState<
    "todas" | "pendiente" | "en_progreso" | "completada"
  >("todas");

  useEffect(() => {
    cargarTareas();
  }, []);

  const cargarTareas = async () => {
    try {
      const res = await obtenerTareas();
      setTareas(res.tareas ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setEditandoId(null);
    setTitulo("");
    setDescripcion("");
    setCategoria("escolar");
    setPrioridad("media");
    setFecha(new Date());
    setModalFormVisible(true);
  };

  const abrirModalEditar = (tarea: Tarea) => {
    setEditandoId(tarea.id);
    setTitulo(tarea.titulo);
    setDescripcion(tarea.descripcion ?? "");
    setCategoria(tarea.categoria);
    setPrioridad(tarea.prioridad);
    setFecha(parseFechaLimite(tarea.fecha_limite) ?? new Date());
    setModalFormVisible(true);
  };

  const guardarTarea = async () => {
    if (!titulo.trim()) return;
    setGuardando(true);

    // Ajuste seguro de fecha para evitar desfase de zona horaria
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = new Date(fecha.getTime() - tzoffset)
      .toISOString()
      .slice(0, 10);

    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      prioridad,
      fecha_limite: localISOTime,
    };

    try {
      if (editandoId) {
        // Editar
        const res = await actualizarTarea(editandoId, payload);
        setTareas((prev) =>
          prev.map((t) =>
            t.id === editandoId
              ? {
                  ...t,
                  ...payload,
                  recomendacion: res.tarea?.recomendacion ?? t.recomendacion,
                }
              : t,
          ),
        );
      } else {
        // Crear
        const res = await crearTarea(payload);
        setTareas((prev) => [
          ...prev,
          { ...res.tarea, recomendacion: res.recomendacion },
        ]);
        if (res.recomendacion) {
          setRecomendacionModal({
            visible: true,
            tarea: { ...res.tarea, recomendacion: res.recomendacion },
          });
        }
      }
      setModalFormVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar la tarea.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (tarea: Tarea) => {
    // Ciclo: pendiente -> en_progreso -> completada -> pendiente
    const nuevoEstado =
      tarea.estado === "pendiente"
        ? "en_progreso"
        : tarea.estado === "en_progreso"
          ? "completada"
          : "pendiente";
    try {
      await actualizarTarea(tarea.id, { estado: nuevoEstado });
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tarea.id ? { ...t, estado: nuevoEstado } : t,
        ),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleEliminar = (id: number) => {
    Alert.alert("Eliminar tarea", "¿Estás seguro de eliminar esta tarea?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await eliminarTarea(id);
            setTareas((prev) => prev.filter((t) => t.id !== id));
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const handleRecalcularIA = async (tareaId: number) => {
    setRecalculandoIA(true);
    try {
      const res = await regenerarRecomendacion(tareaId);
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tareaId ? { ...t, recomendacion: res.recomendacion } : t,
        ),
      );
      // Actualizar el modal si está abierto
      setRecomendacionModal((prev) => ({
        ...prev,
        tarea: { ...prev.tarea!, recomendacion: res.recomendacion },
      }));
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo recalcular con la IA.");
    } finally {
      setRecalculandoIA(false);
    }
  };

  const tareasFiltradas = tareas
    .filter((t) => (filtro === "todas" ? true : t.estado === filtro))
    .sort((a, b) => {
      const fechaA = parseFechaLimite(a.fecha_limite)?.getTime() ?? 0;
      const fechaB = parseFechaLimite(b.fecha_limite)?.getTime() ?? 0;
      return fechaA - fechaB;
    });

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
        <View>
          <Text style={styles.titulo}>Agenda</Text>
          <Text style={styles.subtitulo}>Gestiona tus tareas con IA</Text>
        </View>
        <Pressable style={styles.botonAgregar} onPress={abrirModalCrear}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 4 }}>
            Nueva tarea
          </Text>
        </Pressable>
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

      <Text style={styles.resultadosTexto}>
        {tareasFiltradas.length} resultados con los filtros actuales.
      </Text>

      {/* ══ Lista de tareas ══ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {tareasFiltradas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTexto}>
              No tienes tareas para mostrar con este filtro.
            </Text>
          </View>
        ) : (
          tareasFiltradas.map((tarea) => {
            const catInfo = getCategoriaInfo(tarea.categoria);
            const estInfo = getEstadoEstilos(tarea.estado);
            const completada = tarea.estado === "completada";

            return (
              <View
                key={tarea.id}
                style={[styles.tareaCard, completada && { opacity: 0.7 }]}
              >
                {/* Cabecera de Tarjeta (Tags y Editar) */}
                <View style={styles.cardTop}>
                  <View style={styles.tagsContainer}>
                    <View style={[styles.tag, { backgroundColor: catInfo.bg }]}>
                      <View
                        style={[
                          styles.tagDot,
                          { backgroundColor: catInfo.color },
                        ]}
                      />
                      <Text style={[styles.tagText, { color: catInfo.color }]}>
                        {catInfo.label}
                      </Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: estInfo.bg }]}>
                      <Text style={[styles.tagText, { color: estInfo.color }]}>
                        {estInfo.label}
                      </Text>
                    </View>
                    {tarea.prioridad && (
                      <View
                        style={[styles.tag, { backgroundColor: "#F3F4F6" }]}
                      >
                        <Text style={[styles.tagText, { color: "#4B5563" }]}>
                          Prioridad {tarea.prioridad}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Pressable
                    onPress={() => abrirModalEditar(tarea)}
                    style={styles.editBtn}
                  >
                    <Ionicons name="pencil" size={18} color="#7C3AED" />
                  </Pressable>
                </View>

                {/* Título y Descripción */}
                <Text
                  style={[styles.tareaTitulo, completada && styles.tachado]}
                >
                  {tarea.titulo}
                </Text>
                {tarea.descripcion ? (
                  <Text style={styles.tareaDesc} numberOfLines={2}>
                    {tarea.descripcion}
                  </Text>
                ) : null}

                {/* Meta info (Fecha e IA) */}
                <View style={styles.metaContainer}>
                  {tarea.fecha_limite && (
                    <Text style={styles.fechaTexto}>
                      📆{" "}
                      {parseFechaLimite(tarea.fecha_limite)?.toLocaleDateString(
                        "es-MX",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      ) ?? "Sin fecha"}
                    </Text>
                  )}
                  {tarea.recomendacion && (
                    <Pressable
                      onPress={() =>
                        setRecomendacionModal({ visible: true, tarea })
                      }
                    >
                      <Text style={styles.iaLabel}>
                        ✨ Recomendación disponible
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Acciones */}
                <View style={styles.actionsContainer}>
                  <Pressable
                    onPress={() => cambiarEstado(tarea)}
                    style={[styles.actionBtn, { borderColor: estInfo.color }]}
                  >
                    <Text
                      style={[styles.actionBtnText, { color: estInfo.color }]}
                    >
                      {tarea.estado === "pendiente"
                        ? "Iniciar"
                        : tarea.estado === "en_progreso"
                          ? "Marcar completada"
                          : "Reabrir tarea"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleEliminar(tarea.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ══ Modal de Formulario (Crear/Editar) ══ */}
      <Modal visible={modalFormVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitulo}>
                {editandoId ? "Editar tarea ✏️" : "Nueva tarea ➕"}
              </Text>
              <Text style={styles.modalSub}>
                Regístrala y la IA generará pasos para ayudarte.
              </Text>

              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Entregar proyecto de BD"
                value={titulo}
                onChangeText={setTitulo}
              />

              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="Qué necesitas hacer, requisitos, notas..."
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
              />

              <View style={styles.dosColumnas}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Categoría</Text>
                  <View style={styles.chipsContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {CATEGORIAS.map((c) => (
                        <Pressable
                          key={c.key}
                          onPress={() => setCategoria(c.key as any)}
                          style={[
                            styles.chip,
                            categoria === c.key && {
                              backgroundColor: c.bg,
                              borderColor: c.color,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              categoria === c.key
                                ? { color: c.color, fontWeight: "700" }
                                : {},
                            ]}
                          >
                            {c.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>

              <View style={styles.dosColumnas}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Prioridad</Text>
                  <View style={styles.chipsContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {PRIORIDADES.map((p) => (
                        <Pressable
                          key={p.key}
                          onPress={() => setPrioridad(p.key as any)}
                          style={[
                            styles.chip,
                            prioridad === p.key && {
                              backgroundColor: "#EDE9FE",
                              borderColor: "#7C3AED",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              prioridad === p.key
                                ? { color: "#7C3AED", fontWeight: "700" }
                                : {},
                            ]}
                          >
                            {p.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Fecha de entrega</Text>
              <Pressable
                style={styles.input}
                onPress={() => setMostrarFecha(true)}
              >
                <Text style={{ color: "#1E1B4B" }}>
                  {fecha.toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </Pressable>

              {mostrarFecha && (
                <DateTimePicker
                  value={fecha}
                  mode="date"
                  onChange={(_, selected) => {
                    setMostrarFecha(false);
                    if (selected) setFecha(selected);
                  }}
                />
              )}

              <View style={styles.modalBotones}>
                <Pressable
                  style={styles.botonCancelar}
                  onPress={() => setModalFormVisible(false)}
                >
                  <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.botonGuardar,
                    (!titulo.trim() || guardando) && { opacity: 0.5 },
                  ]}
                  onPress={guardarTarea}
                  disabled={!titulo.trim() || guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.botonGuardarTexto}>
                      {editandoId ? "Actualizar" : "Crear tarea"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ══ Modal Pasos IA ══ */}
      <Modal
        visible={recomendacionModal.visible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Text style={[styles.modalTitulo, { flex: 1 }]}>
                ✨ {recomendacionModal.tarea?.titulo}
              </Text>
              <Pressable
                onPress={() =>
                  setRecomendacionModal({ visible: false, tarea: null })
                }
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {recomendacionModal.tarea?.recomendacion?.consejo && (
              <View style={styles.consejoBox}>
                <Text style={styles.consejoTexto}>
                  💡 {recomendacionModal.tarea.recomendacion.consejo}
                </Text>
              </View>
            )}

            {recomendacionModal.tarea?.recomendacion?.tiempo_estimado && (
              <Text style={styles.tiempoTexto}>
                ⏱ Tiempo estimado:{" "}
                {recomendacionModal.tarea.recomendacion.tiempo_estimado}
              </Text>
            )}

            <Text style={styles.inputLabel}>Pasos a seguir:</Text>
            <ScrollView style={{ maxHeight: 220, marginBottom: 16 }}>
              {recomendacionModal.tarea?.recomendacion?.pasos.map((paso, i) => (
                <View key={i} style={styles.pasoItem}>
                  <View style={styles.pasoBullet}>
                    <Text style={styles.pasoBulletTexto}>{i + 1}</Text>
                  </View>
                  <Text style={styles.pasoTexto}>{paso}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                style={[
                  styles.botonGuardar,
                  { flex: 1, backgroundColor: "#F3F4F6" },
                ]}
                onPress={() => handleRecalcularIA(recomendacionModal.tarea!.id)}
                disabled={recalculandoIA}
              >
                {recalculandoIA ? (
                  <ActivityIndicator color="#7C3AED" />
                ) : (
                  <Text
                    style={[styles.botonGuardarTexto, { color: "#7C3AED" }]}
                  >
                    Recalcular IA
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
    paddingTop: 0,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titulo: { fontSize: 28, fontWeight: "800", color: "#111827" },
  subtitulo: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  botonAgregar: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  // Filtros
  filtrosScrollWrapper: { marginBottom: 10 },
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
  resultadosTexto: { fontSize: 13, color: "#9CA3AF", marginBottom: 16 },

  // Empty
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
  emptyTexto: { color: "#9CA3AF", fontSize: 15, textAlign: "center" },

  // Tarjeta Tarea (Diseño Web)
  tareaCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
    paddingRight: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  tagText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  editBtn: { padding: 4 },

  tareaTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  tareaDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 14,
  },
  tachado: { textDecorationLine: "line-through", color: "#9CA3AF" },

  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  fechaTexto: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  iaLabel: { fontSize: 12, color: "#7C3AED", fontWeight: "700" },

  actionsContainer: { flexDirection: "row", gap: 10, alignItems: "center" },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  actionBtnText: { fontSize: 13, fontWeight: "700" },
  deleteBtn: {
    padding: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    marginLeft: "auto",
  },

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
    maxHeight: "90%",
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  modalSub: { fontSize: 13, color: "#6B7280", marginBottom: 20 },

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

  dosColumnas: { marginBottom: 16 },
  chipsContainer: { flexDirection: "row", paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "transparent",
    marginRight: 8,
  },
  chipText: { fontSize: 13, color: "#4B5563", fontWeight: "500" },

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

  // IA Consejos
  consejoBox: {
    backgroundColor: "#F5F3FF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  consejoTexto: {
    fontSize: 14,
    color: "#5B21B6",
    fontStyle: "italic",
    lineHeight: 20,
  },
  tiempoTexto: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
    fontWeight: "500",
  },
  pasoItem: { flexDirection: "row", gap: 12, marginBottom: 14 },
  pasoBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  pasoBulletTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  pasoTexto: { flex: 1, fontSize: 14, color: "#374151", lineHeight: 22 },
});
