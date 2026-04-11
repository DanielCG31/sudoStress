import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
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

type Mision = {
  id: string;
  titulo: string;
  descripcion: string;
  xp: number;
  completada: boolean;
  tipo: "fija" | "personalizada";
  categoria: "relajacion" | "organizacion" | "productividad" | "bienestar";
  fechaCompletada?: string | null;
};

// Misiones fijas predefinidas por categoría
const MISIONES_FIJAS: Omit<Mision, "id" | "completada" | "fechaCompletada">[] =
  [
    // Relajación
    {
      titulo: "🧘 Respira profundo",
      descripcion: "Toma 5 minutos para hacer respiración profunda",
      xp: 15,
      tipo: "fija",
      categoria: "relajacion",
    },
    {
      titulo: "🚶 Sal a caminar",
      descripcion: "Da una caminata de al menos 10 minutos",
      xp: 20,
      tipo: "fija",
      categoria: "relajacion",
    },
    {
      titulo: "🎵 Escucha música",
      descripcion: "Pon tu playlist favorita y relájate 15 min",
      xp: 10,
      tipo: "fija",
      categoria: "relajacion",
    },
    {
      titulo: "😴 Duerme 8 horas",
      descripcion: "Asegúrate de dormir tus 8 horas esta noche",
      xp: 25,
      tipo: "fija",
      categoria: "relajacion",
    },
    // Organización
    {
      titulo: "📝 Haz tu lista del día",
      descripcion: "Escribe todas las tareas que tienes que hacer hoy",
      xp: 15,
      tipo: "fija",
      categoria: "organizacion",
    },
    {
      titulo: "🗂️ Organiza tus apuntes",
      descripcion: "Ordena los apuntes de una materia",
      xp: 20,
      tipo: "fija",
      categoria: "organizacion",
    },
    {
      titulo: "📅 Planea tu semana",
      descripcion: "Revisa tu agenda y planea las actividades de la semana",
      xp: 25,
      tipo: "fija",
      categoria: "organizacion",
    },
    // Productividad
    {
      titulo: "📚 Estudia 30 minutos",
      descripcion: "Dedica 30 minutos sin distracciones a estudiar",
      xp: 30,
      tipo: "fija",
      categoria: "productividad",
    },
    {
      titulo: "✅ Completa una tarea",
      descripcion: "Termina una tarea pendiente de tu agenda",
      xp: 35,
      tipo: "fija",
      categoria: "productividad",
    },
    {
      titulo: "🔕 Modo enfoque",
      descripcion: "Silencia el celular y trabaja 25 min sin interrupciones",
      xp: 30,
      tipo: "fija",
      categoria: "productividad",
    },
    // Bienestar
    {
      titulo: "💧 Toma agua",
      descripcion: "Toma al menos 2 litros de agua hoy",
      xp: 10,
      tipo: "fija",
      categoria: "bienestar",
    },
    {
      titulo: "🥗 Come bien",
      descripcion: "Come una comida saludable y sin prisas",
      xp: 15,
      tipo: "fija",
      categoria: "bienestar",
    },
    {
      titulo: "📵 Desconéctate",
      descripcion: "Aléjate de redes sociales por 1 hora",
      xp: 20,
      tipo: "fija",
      categoria: "bienestar",
    },
  ];

const CATEGORIAS = [
  { key: "todas", label: "Todas", emoji: "⭐" },
  { key: "relajacion", label: "Relajación", emoji: "🧘" },
  { key: "organizacion", label: "Organización", emoji: "📝" },
  { key: "productividad", label: "Productividad", emoji: "🚀" },
  { key: "bienestar", label: "Bienestar", emoji: "💚" },
];

const CATEGORIA_COLORS: Record<string, string> = {
  relajacion: "#8B5CF6",
  organizacion: "#3B82F6",
  productividad: "#F59E0B",
  bienestar: "#10B981",
};

export default function MisionesScreen() {
  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [tab, setTab] = useState<"pendientes" | "completadas">("pendientes");

  // Formulario nueva misión personalizada
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaDesc, setNuevaDesc] = useState("");
  const [nuevoXP, setNuevoXP] = useState("20");
  const [nuevaCategoria, setNuevaCategoria] =
    useState<Mision["categoria"]>("organizacion");

  const hoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    cargarMisiones();
  }, []);

  const cargarMisiones = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      // Verificar si ya tiene misiones fijas del día de hoy
      const snap = await getDocs(
        query(collection(db, "users", uid, "misiones"), orderBy("tipo")),
      );
      const existentes = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Mision,
      );

      // Si no hay misiones fijas, crearlas
      const tieneFijas = existentes.some((m) => m.tipo === "fija");
      if (!tieneFijas) {
        await inicializarMisionesFijas(uid, existentes);
      } else {
        setMisiones(existentes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const inicializarMisionesFijas = async (
    uid: string,
    existentes: Mision[],
  ) => {
    try {
      const nuevas: Mision[] = [];
      for (const mision of MISIONES_FIJAS) {
        const docRef = await addDoc(collection(db, "users", uid, "misiones"), {
          ...mision,
          completada: false,
          fechaCompletada: null,
        });
        nuevas.push({ id: docRef.id, completada: false, ...mision });
      }
      setMisiones([...existentes, ...nuevas]);
    } catch (e) {
      console.error(e);
    }
  };

  const completarMision = async (mision: Mision) => {
    if (mision.completada) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      // Marcar misión como completada
      await updateDoc(doc(db, "users", uid, "misiones", mision.id), {
        completada: true,
        fechaCompletada: hoy,
      });

      // Sumar XP al perfil
      const perfilDoc = await getDoc(doc(db, "users", uid));
      const xpActual = perfilDoc.data()?.xp ?? 0;
      const nuevoXP = xpActual + mision.xp;
      const nivelActual = perfilDoc.data()?.nivel ?? 1;
      const nuevoNivel = Math.floor(nuevoXP / 100) + 1;

      await setDoc(
        doc(db, "users", uid),
        {
          xp: nuevoXP,
          nivel: nuevoNivel,
        },
        { merge: true },
      );

      setMisiones((prev) =>
        prev.map((m) =>
          m.id === mision.id
            ? { ...m, completada: true, fechaCompletada: hoy }
            : m,
        ),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const agregarMisionPersonalizada = async () => {
    if (!nuevoTitulo.trim()) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setGuardando(true);

    try {
      const nueva = {
        titulo: nuevoTitulo.trim(),
        descripcion: nuevaDesc.trim(),
        xp: parseInt(nuevoXP) || 20,
        tipo: "personalizada" as const,
        categoria: nuevaCategoria,
        completada: false,
        fechaCompletada: null,
      };
      const docRef = await addDoc(
        collection(db, "users", uid, "misiones"),
        nueva,
      );
      setMisiones((prev) => [...prev, { id: docRef.id, ...nueva }]);
      cerrarModal();
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarMision = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await deleteDoc(doc(db, "users", uid, "misiones", id));
      setMisiones((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setNuevoTitulo("");
    setNuevaDesc("");
    setNuevoXP("20");
    setNuevaCategoria("organizacion");
  };

  const misionesFiltradas = misiones
    .filter((m) => (tab === "pendientes" ? !m.completada : m.completada))
    .filter(
      (m) => categoriaActiva === "todas" || m.categoria === categoriaActiva,
    );

  const xpTotal = misiones
    .filter((m) => m.completada)
    .reduce((acc, m) => acc + m.xp, 0);

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
        <Text style={styles.titulo}>Misiones 🎮</Text>
        <Pressable
          style={styles.botonAgregar}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Resumen XP */}
      <View style={styles.xpCard}>
        <View>
          <Text style={styles.xpLabel}>XP ganado en misiones</Text>
          <Text style={styles.xpValor}>⭐ {xpTotal} XP</Text>
        </View>
        <View style={styles.xpStats}>
          <Text style={styles.xpStatTexto}>
            ✅ {misiones.filter((m) => m.completada).length} completadas
          </Text>
          <Text style={styles.xpStatTexto}>
            🎯 {misiones.filter((m) => !m.completada).length} pendientes
          </Text>
        </View>
      </View>

      {/* Tabs pendientes / completadas */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tab, tab === "pendientes" && styles.tabActivo]}
          onPress={() => setTab("pendientes")}
        >
          <Text
            style={[
              styles.tabTexto,
              tab === "pendientes" && styles.tabTextoActivo,
            ]}
          >
            Pendientes
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "completadas" && styles.tabActivo]}
          onPress={() => setTab("completadas")}
        >
          <Text
            style={[
              styles.tabTexto,
              tab === "completadas" && styles.tabTextoActivo,
            ]}
          >
            Completadas
          </Text>
        </Pressable>
      </View>

      {/* Filtro categorías */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasScroll}
      >
        {CATEGORIAS.map((cat) => (
          <Pressable
            key={cat.key}
            style={[
              styles.categoriaBtn,
              categoriaActiva === cat.key && styles.categoriaBtnActiva,
            ]}
            onPress={() => setCategoriaActiva(cat.key)}
          >
            <Text
              style={[
                styles.categoriaBtnTexto,
                categoriaActiva === cat.key && styles.categoriaBtnTextoActivo,
              ]}
            >
              {cat.emoji} {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Lista misiones */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {misionesFiltradas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              {tab === "pendientes" ? "🎉" : "📭"}
            </Text>
            <Text style={styles.emptyTexto}>
              {tab === "pendientes"
                ? "¡Sin misiones pendientes!"
                : "Aún no completas misiones"}
            </Text>
          </View>
        ) : (
          misionesFiltradas.map((mision) => {
            const color = CATEGORIA_COLORS[mision.categoria] ?? "#7C3AED";
            return (
              <View
                key={mision.id}
                style={[
                  styles.misionCard,
                  mision.completada && styles.misionCompletada,
                ]}
              >
                <View
                  style={[styles.misionAccent, { backgroundColor: color }]}
                />
                <View style={styles.misionInfo}>
                  <View style={styles.misionHeaderRow}>
                    <Text
                      style={[
                        styles.misionTitulo,
                        mision.completada && styles.tachado,
                      ]}
                    >
                      {mision.titulo}
                    </Text>
                    {mision.tipo === "personalizada" && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeTexto}>Custom</Text>
                      </View>
                    )}
                  </View>
                  {mision.descripcion ? (
                    <Text style={styles.misionDesc}>{mision.descripcion}</Text>
                  ) : null}
                  <Text style={[styles.misionXP, { color }]}>
                    +{mision.xp} XP
                  </Text>
                </View>

                {/* Acciones */}
                <View style={styles.misionAcciones}>
                  {!mision.completada ? (
                    <Pressable
                      style={[
                        styles.botonCompletar,
                        { backgroundColor: color },
                      ]}
                      onPress={() => completarMision(mision)}
                    >
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </Pressable>
                  ) : (
                    <Ionicons
                      name="checkmark-circle"
                      size={28}
                      color="#10B981"
                    />
                  )}
                  {mision.tipo === "personalizada" && (
                    <Pressable
                      onPress={() => eliminarMision(mision.id)}
                      style={styles.eliminarBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#EF4444"
                      />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal nueva misión personalizada */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>
              Nueva misión personalizada 🎯
            </Text>

            <Text style={styles.inputLabel}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Ir al gimnasio"
              value={nuevoTitulo}
              onChangeText={setNuevoTitulo}
              maxLength={50}
            />

            <Text style={styles.inputLabel}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Describe en qué consiste la misión"
              value={nuevaDesc}
              onChangeText={setNuevaDesc}
              multiline
              maxLength={100}
            />

            <Text style={styles.inputLabel}>Categoría</Text>
            <View style={styles.categoriasGrid}>
              {CATEGORIAS.filter((c) => c.key !== "todas").map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[
                    styles.categoriaOpcion,
                    nuevaCategoria === cat.key && {
                      backgroundColor: CATEGORIA_COLORS[cat.key],
                      borderColor: CATEGORIA_COLORS[cat.key],
                    },
                  ]}
                  onPress={() =>
                    setNuevaCategoria(cat.key as Mision["categoria"])
                  }
                >
                  <Text
                    style={[
                      styles.categoriaOpcionTexto,
                      nuevaCategoria === cat.key && { color: "#fff" },
                    ]}
                  >
                    {cat.emoji} {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>XP de recompensa</Text>
            <View style={styles.xpOpcionesRow}>
              {["10", "20", "30", "50"].map((val) => (
                <Pressable
                  key={val}
                  style={[
                    styles.xpOpcion,
                    nuevoXP === val && styles.xpOpcionActiva,
                  ]}
                  onPress={() => setNuevoXP(val)}
                >
                  <Text
                    style={[
                      styles.xpOpcionTexto,
                      nuevoXP === val && { color: "#fff" },
                    ]}
                  >
                    +{val}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalBotones}>
              <Pressable style={styles.botonCancelar} onPress={cerrarModal}>
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.botonGuardar,
                  (!nuevoTitulo.trim() || guardando) && { opacity: 0.5 },
                ]}
                onPress={agregarMisionPersonalizada}
                disabled={!nuevoTitulo.trim() || guardando}
              >
                <Text style={styles.botonGuardarTexto}>
                  {guardando ? "Guardando..." : "Crear misión"}
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
  categoriasScroll: { marginBottom: 12, flexGrow: 0 },
  categoriaBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoriaBtnActiva: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  categoriaBtnTexto: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  categoriaBtnTextoActivo: { color: "#fff" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTexto: { color: "#9CA3AF", fontSize: 15 },
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
  customBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customBadgeTexto: { fontSize: 10, color: "#D97706", fontWeight: "700" },
  misionDesc: { fontSize: 12, color: "#9CA3AF", marginBottom: 6 },
  misionXP: { fontSize: 13, fontWeight: "700" },
  misionAcciones: {
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  botonCompletar: { borderRadius: 10, padding: 8 },
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
  categoriasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoriaOpcion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  categoriaOpcionTexto: { fontSize: 12, color: "#374151", fontWeight: "500" },
  xpOpcionesRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  xpOpcion: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  xpOpcionActiva: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  xpOpcionTexto: { fontWeight: "700", color: "#374151" },
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
