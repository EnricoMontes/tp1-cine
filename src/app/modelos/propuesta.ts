export interface Propuesta {
  id: number;
  titulo: string;
  descripcion: string;
  motivo: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  respuesta: string | null;
  pelicula_id: number | null;
  creado_en: string;
  resuelta_en: string | null;
  usuario?: string;
}
