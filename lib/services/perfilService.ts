import { authFetch } from "../api";

export const obtenerPerfil = async () => {
  const res = await authFetch("/perfil");
  return res.json();
};

export const actualizarPerfil = async (datos: {
  name?: string;
  semestre?: string;
}) => {
  const res = await authFetch("/perfil", {
    method: "PUT",
    body: JSON.stringify(datos),
  });
  return res.json();
};

export const obtenerHistorialEstres = async (dias: number = 7) => {
  const res = await authFetch(`/perfil/historial-estres?dias=${dias}`);
  return res.json();
};

export const verificarLogros = async () => {
  const res = await authFetch("/perfil/verificar-logros", { method: "POST" });
  return res.json();
};
