import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { auth, db } from "../../lib/firebase";

type Tarea = {
  id: string;
  titulo: string;
  tipo: "tarea" | "examen" | "proyecto" | "otro";
  fechaEntrega: any;
  completada: boolean;
};

const TIPOS = [
  { key: "tarea", label: "📝 Tarea", color: "#7C3AED" },
  { key: "examen", label: "📖 Examen", color: "#EF4444" },
  { key: "proyecto", label: "💻 Proyecto", color: "#F59E0B" },
  { key: "otro", label: "📌 Otro", color: "#6B7280" },
];

const getTipoInfo = (tipo: string) =>
  TIPOS.find((t) => t.key === tipo) ?? TIPOS[3];

const diasRestantes = (fecha: any) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const entrega = new Date(fecha?.seconds * 1000);
  entrega.setHours(0, 0, 0, 0);
  const diff = Math.ceil(
    (entrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff;
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

  // Formulario nueva tarea
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<Tarea["tipo"]>("tarea");
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
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const q = query(
        collection(db, "users", uid, "tareas"),
        orderBy("fechaEntrega", "asc"),
      );
      const snap = await getDocs(q);
      setTareas(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tarea));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const agregarTarea = async () => {
    if (!titulo.trim()) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setGuardando(true);
    try {
      const nueva = {
        titulo: titulo.trim(),
        tipo,
        fechaEntrega: fecha,
        completada: false,
      };
      const docRef = await addDoc(
        collection(db, "users", uid, "tareas"),
        nueva,
      );
      setTareas((prev) =>
        [...prev, { id: docRef.id, ...nueva } as any].sort(
          (a, b) => a.fechaEntrega?.seconds - b.fechaEntrega?.seconds,
        ),
      );
      cerrarModal();
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const toggleCompletar = async (tarea: Tarea) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await updateDoc(doc(db, "users", uid, "tareas", tarea.id), {
        completada: !tarea.completada,
      });
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tarea.id ? { ...t, completada: !t.completada } : t,
        ),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const eliminarTarea = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await deleteDoc(doc(db, "users", uid, "tareas", id));
      setTareas((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setTitulo("");
    setTipo("tarea");
    setFecha(new Date());
  };

  const tareasFiltradas = tareas.filter((t) => {
    if (filtro === "pendientes") return !t.completada;
    if (filtro === "completadas") return t.completada;
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
            {tareas.filter((t) => !t.completada).length}
          </Text>
          <Text style={styles.resumenLabel}>Pendientes</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor: "#D1FAE5" }]}>
          <Text style={[styles.resumenNumero, { color: "#059669" }]}>
            {tareas.filter((t) => t.completada).length}
          </Text>
          <Text style={styles.resumenLabel}>Completadas</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor: "#FEE2E2" }]}>
          <Text style={[styles.resumenNumero, { color: "#EF4444" }]}>
            {
              tareas.filter(
                (t) => !t.completada && diasRestantes(t.fechaEntrega) <= 2,
              ).length
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
            const tipoInfo = getTipoInfo(tarea.tipo);
            const dias = diasRestantes(tarea.fechaEntrega);
            return (
              <View
                key={tarea.id}
                style={[
                  styles.tareaCard,
                  tarea.completada && styles.tareaCompletada,
                ]}
              >
                {/* Checkbox */}
                <Pressable
                  onPress={() => toggleCompletar(tarea)}
                  style={styles.checkbox}
                >
                  <Ionicons
                    name={
                      tarea.completada ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={26}
                    color={tarea.completada ? "#10B981" : "#D1D5DB"}
                  />
                </Pressable>

                {/* Info */}
                <View style={styles.tareaInfo}>
                  <Text
                    style={[
                      styles.tareaTitulo,
                      tarea.completada && styles.tachado,
                    ]}
                  >
                    {tarea.titulo}
                  </Text>
                  <View style={styles.tareaMetaRow}>
                    <View
                      style={[
                        styles.tipoBadge,
                        { backgroundColor: tipoInfo.color + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.tipoTexto, { color: tipoInfo.color }]}
                      >
                        {tipoInfo.label}
                      </Text>
                    </View>
                    {!tarea.completada && (
                      <Text
                        style={[styles.diasTexto, { color: colorDias(dias) }]}
                      >
                        {labelDias(dias)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.fechaTexto}>
                    📆{" "}
                    {new Date(
                      tarea.fechaEntrega?.seconds * 1000,
                    ).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                {/* Eliminar */}
                <Pressable
                  onPress={() => eliminarTarea(tarea.id)}
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

            {/* Título */}
            <Text style={styles.inputLabel}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Entregar proyecto de BD"
              value={titulo}
              onChangeText={setTitulo}
              maxLength={60}
            />

            {/* Tipo */}
            <Text style={styles.inputLabel}>Tipo</Text>
            <View style={styles.tiposRow}>
              {TIPOS.map((t) => (
                <Pressable
                  key={t.key}
                  style={[
                    styles.tipoBtn,
                    tipo === t.key && { backgroundColor: t.color },
                  ]}
                  onPress={() => setTipo(t.key as Tarea["tipo"])}
                >
                  <Text
                    style={[
                      styles.tipoBtnTexto,
                      tipo === t.key && { color: "#fff" },
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Fecha */}
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

            {/* Botones */}
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
                  {guardando ? "Guardando..." : "Agregar"}
                </Text>
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
    marginBottom: 24,
  },
  fechaBtnTexto: { fontSize: 14, color: "#7C3AED", fontWeight: "500" },
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
