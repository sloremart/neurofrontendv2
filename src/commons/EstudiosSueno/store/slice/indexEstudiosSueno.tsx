import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Especialista { codigo: number; nombre: string; especialidad: string }
interface Tecnico      { nombre: string; email: string }
interface Registro     { [key: string]: any }

interface EstudiosSuenoState {
  registros:     Registro[];
  especialistas: Especialista[];
  tecnicos:      Tecnico[];
  estudios:      { value: string; label: string }[];
  equipos:       { value: string; label: string }[];
  entidades:     { nombre: string }[];
}

const initialState: EstudiosSuenoState = {
  registros:     [],
  especialistas: [],
  tecnicos:      [],
  estudios:      [],
  equipos:       [],
  entidades:     [],
};

const slice = createSlice({
  name: "estudios_sueno",
  initialState,
  reducers: {
    set_registros:     (s, a: PayloadAction<Registro[]>)                         => { s.registros     = a.payload },
    set_especialistas: (s, a: PayloadAction<Especialista[]>)                     => { s.especialistas = a.payload },
    set_tecnicos:      (s, a: PayloadAction<Tecnico[]>)                          => { s.tecnicos      = a.payload },
    set_estudios:      (s, a: PayloadAction<{ value: string; label: string }[]>) => { s.estudios      = a.payload },
    set_equipos:       (s, a: PayloadAction<{ value: string; label: string }[]>) => { s.equipos       = a.payload },
    set_entidades:     (s, a: PayloadAction<{ nombre: string }[]>)               => { s.entidades     = a.payload },
  },
});

export const { set_registros, set_especialistas, set_tecnicos, set_estudios, set_equipos, set_entidades } = slice.actions;
export default slice.reducer;
