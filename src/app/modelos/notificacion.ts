export interface Notificacion {
  id: number;
  tipo: 'funcion_cancelada' | 'propuesta_aceptada' | 'propuesta_rechazada' | 'lugar_liberado' | 'credito_recibido';
  titulo: string;
  mensaje: string;
  pelicula_id: number | null;
  funcion_id?: number | null;
  leida: boolean;
  creado_en: string;
}
