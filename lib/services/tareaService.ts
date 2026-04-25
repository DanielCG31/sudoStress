import { authFetch } from "../api";

export const obtenerTareas = async (filtros: Record<string, string> = {}) => {
  const params = new URLSearchParams(filtros).toString();
  const res = await authFetch(`/tareas${params ? "?" + params : ""}`);
  return res.json();
};

export const crearTarea = async (datos: {
  titulo: string;
  descripcion?: string;
  categoria?: string;
  prioridad?: string;
  fecha_limite?: string;
}) => {
  const res = await authFetch("/tareas", {
    method: "POST",
    body: JSON.stringify(datos),
  });
  return res.json();
};

export const actualizarTarea = async (tareaId: number, datos: object) => {
  const res = await authFetch(`/tareas/${tareaId}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
  return res.json();
};

export const eliminarTarea = async (tareaId: number) => {
  const res = await authFetch(`/tareas/${tareaId}`, { method: "DELETE" });
  return res.json();
};

export const regenerarRecomendacion = async (tareaId: number) => {
  const res = await authFetch(`/tareas/${tareaId}/regenerar`, {
    method: "POST",
  });
  return res.json();
};
