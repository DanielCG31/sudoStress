import { authFetch } from "../api";

export const registrarCheckin = async (nivelEstres: number, nota?: string) => {
  const res = await authFetch("/checkins", {
    method: "POST",
    body: JSON.stringify({ nivel_estres: nivelEstres, nota }),
  });
  return res.json();
};

export const obtenerHistorial = async (dias: number = 7) => {
  const res = await authFetch(`/checkins?dias=${dias}`);
  return res.json();
};

export const checkinHoy = async () => {
  const res = await authFetch("/checkins/hoy");
  return res.json();
};
