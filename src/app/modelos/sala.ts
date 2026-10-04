export type Formato = '2D' | '3D' | '4D' | '5D';

export interface Sala {
  id: number;
  nombre: string;
  formato: Formato;
}

export interface Butaca {
  id: number;
  sala_id: number;
  fila: string;
  numero: number;
  columna: 1 | 2 | 3;
  tipo: 'normal' | 'accesible' | 'vip';
}
