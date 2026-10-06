export interface Cupon {
  id: number;
  codigo: string | null;
  porcentaje: number;
  tipo: 'bienvenida' | 'mayores_50' | 'codigo';
  activo: boolean;
}
