export interface Genero {
  id: number;
  nombre: string;
}

export interface Pelicula {
  id: number;
  nombre: string;
  sinopsis: string;
  duracion_min: number;
  imagen_url: string | null;
  restriccion_edad: 13 | 18 | null;
  fecha_estreno: string | null;
  estado: 'cartelera' | 'proximamente' | 'archivada';
  visible_en_home: boolean;
  precio_base: number;
  preventa_activa: boolean;
  precio_preventa: number | null;
  generos?: Genero[];
}
