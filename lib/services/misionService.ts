import { authFetch } from "../api";

export const obtenerMisiones = async (estado?: string) => {
  const url = estado ? `/misiones?estado=${estado}` : "/misiones";
  const res = await authFetch(url);
  return res.json();
};

export const actualizarEstado = async (misionId: number, estado: string) => {
  const res = await authFetch(`/misiones/${misionId}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
  return res.json();
};

export const obtenerEstadisticas = async () => {
  const res = await authFetch("/misiones/estadisticas");
  return res.json();
};
