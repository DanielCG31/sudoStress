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
} from "../../lib/services/tareaService";

type Tarea = {
  id: number;
  titulo: string;
  categoria: "escolar" | "personal" | "salud" | "otro";
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

const CATEGORIAS = [
  { key: "escolar", label: "📝 Escolar", color: "#7C3AED" },
  { key: "personal", label: "🙋 Personal", color: "#3B82F6" },
  { key: "salud", label: "💚 Salud", color: "#10B981" },
  { key: "otro", label: "📌 Otro", color: "#6B7280" },
];

const getCategoriaInfo = (cat: string) =>
  CATEGORIAS.find((c) => c.key === cat) ?? CATEGORIAS[3];

const diasRestantes = (fecha: string | null) => {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const entrega = new Date(fecha);
  entrega.setHours(0, 0, 0, 0);
  return Math.ceil((entrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
};

const colorDias = (dias: number) => {
  if (dias < 0) return "#9CA3AF";
  if (dias <= 1) return "#EF4444";
  if (dias <= 3) return "#F59E0B";
  return "#10B981";
};

const labelDias = (dias: number) => {
  if (dias < 0) return "Vencida";
  if (dias === 0) return "¡Hoy!";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
};

export default function AgendaScreen() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [recomendacionModal, setRecomendacionModal] =
    useState<RecomendacionModal>({
      visible: false,
      tarea: null,
    });

  // Formulario nueva tarea
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<Tarea["categoria"]>("escolar");
  const [fecha, setFecha] = useState(new Date());
  const [guardando, setGuardando] = useState(false);

  // Filtro
  const [filtro, setFiltro] = useState<"todas" | "pendientes" | "completadas">(
    "pendientes",
  );

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

  const agregarTarea = async () => {
    if (!titulo.trim()) return;
    setGuardando(true);
    try {
      const res = await crearTarea({
        titulo: titulo.trim(),
        categoria,
        fecha_limite: fecha.toISOString().split("T")[0],
      });

      // Agregar tarea con la recomendación IA incluida
      setTareas((prev) =>
        [...prev, { ...res.tarea, recomendacion: res.recomendacion }].sort(
          (a, b) =>
            new Date(a.fecha_limite ?? "").getTime() -
            new Date(b.fecha_limite ?? "").getTime(),
        ),
      );

      // Mostrar recomendación IA automáticamente
      if (res.recomendacion) {
        setRecomendacionModal({
          visible: true,
          tarea: { ...res.tarea, recomendacion: res.recomendacion },
        });
      }

      cerrarModal();
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const toggleCompletar = async (tarea: Tarea) => {
    const nuevoEstado =
      tarea.estado === "completada" ? "pendiente" : "completada";
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

  const handleEliminar = async (id: number) => {
    Alert.alert("Eliminar tarea", "¿Estás seguro?", [
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

  const cerrarModal = () => {
    setModalVisible(false);
    setTitulo("");
    setCategoria("escolar");
    setFecha(new Date());
  };

  const tareasFiltradas = tareas.filter((t) => {
    if (filtro === "pendientes") return t.estado !== "completada";
    if (filtro === "completadas") return t.estado === "completada";
    return true;
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Mi Agenda 📅</Text>
        <Pressable
          style={styles.botonAgregar}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Resumen */}
      <View style={styles.resumenRow}>
        <View style={[styles.resumenCard, { backgroundColor: "#EDE9FE" }]}>
          <Text style={styles.resumenNumero}>
            {tareas.filter((t) => t.estado !== "completada").length}
          </Text>
          <Text style={styles.resumenLabel}>Pendientes</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor: "#D1FAE5" }]}>
          <Text style={[styles.resumenNumero, { color: "#059669" }]}>
            {tareas.filter((t) => t.estado === "completada").length}
          </Text>
          <Text style={styles.resumenLabel}>Completadas</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor: "#FEE2E2" }]}>
          <Text style={[styles.resumenNumero, { color: "#EF4444" }]}>
            {
              tareas.filter((t) => {
                const dias = diasRestantes(t.fecha_limite);
                return t.estado !== "completada" && dias !== null && dias <= 2;
              }).length
            }
          </Text>
          <Text style={styles.resumenLabel}>Urgentes</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosRow}>
        {(["pendientes", "todas", "completadas"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filtroBtn, filtro === f && styles.filtroBtnActivo]}
            onPress={() => setFiltro(f)}
          >
            <Text
              style={[
                styles.filtroTexto,
                filtro === f && styles.filtroTextoActivo,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Lista de tareas */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {tareasFiltradas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTexto}>
              {filtro === "pendientes"
                ? "No tienes pendientes"
                : "Nada aquí aún"}
            </Text>
          </View>
        ) : (
          tareasFiltradas.map((tarea) => {
            const catInfo = getCategoriaInfo(tarea.categoria);
            const dias = diasRestantes(tarea.fecha_limite);
            const completada = tarea.estado === "completada";
            return (
              <View
                key={tarea.id}
                style={[styles.tareaCard, completada && styles.tareaCompletada]}
              >
                {/* Checkbox */}
                <Pressable
                  onPress={() => toggleCompletar(tarea)}
                  style={styles.checkbox}
                >
                  <Ionicons
                    name={completada ? "checkmark-circle" : "ellipse-outline"}
                    size={26}
                    color={completada ? "#10B981" : "#D1D5DB"}
                  />
                </Pressable>

                {/* Info */}
                <Pressable
                  style={styles.tareaInfo}
                  onPress={() =>
                    tarea.recomendacion &&
                    setRecomendacionModal({ visible: true, tarea })
                  }
                >
                  <Text
                    style={[styles.tareaTitulo, completada && styles.tachado]}
                  >
                    {tarea.titulo}
                  </Text>
                  <View style={styles.tareaMetaRow}>
                    <View
                      style={[
                        styles.tipoBadge,
                        { backgroundColor: catInfo.color + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.tipoTexto, { color: catInfo.color }]}
                      >
                        {catInfo.label}
                      </Text>
                    </View>
                    {dias !== null && !completada && (
                      <Text
                        style={[styles.diasTexto, { color: colorDias(dias) }]}
                      >
                        {labelDias(dias)}
                      </Text>
                    )}
                    {tarea.recomendacion && (
                      <Text style={styles.iaLabel}>✨ Ver pasos</Text>
                    )}
                  </View>
                  {tarea.fecha_limite && (
                    <Text style={styles.fechaTexto}>
                      📆{" "}
                      {new Date(tarea.fecha_limite).toLocaleDateString(
                        "es-MX",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </Text>
                  )}
                </Pressable>

                {/* Eliminar */}
                <Pressable
                  onPress={() => handleEliminar(tarea.id)}
                  style={styles.eliminarBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal agregar tarea */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Nueva tarea ➕</Text>

            <Text style={styles.inputLabel}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Entregar proyecto de BD"
              value={titulo}
              onChangeText={setTitulo}
              maxLength={60}
            />

            <Text style={styles.inputLabel}>Categoría</Text>
            <View style={styles.tiposRow}>
              {CATEGORIAS.map((c) => (
                <Pressable
                  key={c.key}
                  style={[
                    styles.tipoBtn,
                    categoria === c.key && { backgroundColor: c.color },
                  ]}
                  onPress={() => setCategoria(c.key as Tarea["categoria"])}
                >
                  <Text
                    style={[
                      styles.tipoBtnTexto,
                      categoria === c.key && { color: "#fff" },
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Fecha de entrega</Text>
            <Pressable
              style={styles.fechaBtn}
              onPress={() => setMostrarFecha(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#7C3AED" />
              <Text style={styles.fechaBtnTexto}>
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
                minimumDate={new Date()}
                onChange={(_, selected) => {
                  setMostrarFecha(false);
                  if (selected) setFecha(selected);
                }}
              />
            )}

            <Text style={styles.iaNote}>
              ✨ La IA generará pasos y consejos automáticamente
            </Text>

            <View style={styles.modalBotones}>
              <Pressable style={styles.botonCancelar} onPress={cerrarModal}>
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.botonGuardar,
                  (!titulo.trim() || guardando) && { opacity: 0.5 },
                ]}
                onPress={agregarTarea}
                disabled={!titulo.trim() || guardando}
              >
                <Text style={styles.botonGuardarTexto}>
                  {guardando ? "Analizando con IA..." : "Agregar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal pasos IA */}
      <Modal
        visible={recomendacionModal.visible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>
              ✨ {recomendacionModal.tarea?.titulo}
            </Text>

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
            <ScrollView style={{ maxHeight: 220 }}>
              {recomendacionModal.tarea?.recomendacion?.pasos.map((paso, i) => (
                <View key={i} style={styles.pasoItem}>
                  <View style={styles.pasoBullet}>
                    <Text style={styles.pasoBulletTexto}>{i + 1}</Text>
                  </View>
                  <Text style={styles.pasoTexto}>{paso}</Text>
                </View>
              ))}
            </ScrollView>

            <Pressable
              style={styles.botonGuardar}
              onPress={() =>
                setRecomendacionModal({ visible: false, tarea: null })
              }
            >
              <Text style={styles.botonGuardarTexto}>Entendido 👍</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  botonAgregar: { backgroundColor: "#7C3AED", borderRadius: 12, padding: 8 },
  resumenRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  resumenCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  resumenNumero: { fontSize: 24, fontWeight: "bold", color: "#7C3AED" },
  resumenLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  filtrosRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filtroBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filtroBtnActivo: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  filtroTexto: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  filtroTextoActivo: { color: "#fff" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTexto: { color: "#9CA3AF", fontSize: 15 },
  tareaCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tareaCompletada: { opacity: 0.6 },
  checkbox: { padding: 2 },
  tareaInfo: { flex: 1 },
  tareaTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E1B4B",
    marginBottom: 6,
  },
  tachado: { textDecorationLine: "line-through", color: "#9CA3AF" },
  tareaMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tipoBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  tipoTexto: { fontSize: 11, fontWeight: "600" },
  diasTexto: { fontSize: 12, fontWeight: "700" },
  iaLabel: { fontSize: 11, color: "#7C3AED", fontWeight: "600" },
  fechaTexto: { fontSize: 12, color: "#9CA3AF" },
  eliminarBtn: { padding: 4 },
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
  tiposRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tipoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tipoBtnTexto: { fontSize: 12, color: "#374151", fontWeight: "500" },
  fechaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F3FF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  fechaBtnTexto: { fontSize: 14, color: "#7C3AED", fontWeight: "500" },
  iaNote: {
    fontSize: 12,
    color: "#7C3AED",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 20,
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
  consejoBox: {
    backgroundColor: "#EDE9FE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  consejoTexto: { fontSize: 13, color: "#5B21B6", fontStyle: "italic" },
  tiempoTexto: { fontSize: 13, color: "#6B7280", marginBottom: 12 },
  pasoItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  pasoBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  pasoBulletTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  pasoTexto: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 20 },
});
