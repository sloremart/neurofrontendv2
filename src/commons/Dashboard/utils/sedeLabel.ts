/**
 * Convierte el id_sede de ZeusSalud al label visible en la UI.
 * En la BD la numeración arranca en 2 (Sede 1 = id 2, Sede 2 = id 3).
 */
export const sedeLabel = (id_sede: number): string =>
  `S0${id_sede - 1}`;

export const sedeColor = (
  id_sede: number
): { bgcolor: string; color: string } =>
  id_sede === 2
    ? { bgcolor: "#EDE9FB", color: "#6D28D9" }
    : { bgcolor: "#F3E8FF", color: "#7C3AED" };
