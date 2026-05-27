
export interface IUsuarios {
    users:IObjUsuarios[],
}

export interface IObjUsuarios {
    id: number;
    username: string;
    nombre: string;
    email: string;
    cargo: string;
    id_usuario_antares:string;
  }
  