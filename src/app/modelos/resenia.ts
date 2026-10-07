export interface ReseniaDatos {
  pelicula_id: number;
  autor: string;
  estrellas: number;
  comentario: string;
}

export interface Resenia extends ReseniaDatos {
  id: number;
  usuario_id: string;
  creado_en: string;
}
