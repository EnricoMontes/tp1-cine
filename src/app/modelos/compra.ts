import { Butaca } from './sala';
import { Funcion } from './funcion';

export interface EntradaComprada {
  id: number;
  precio: number;
  butacas: Butaca;
  funciones: Funcion;
}

export interface Compra {
  id: string;
  subtotal: number;
  descuento: number;
  total: number;
  puntos_ganados: number;
  estado: 'pagada' | 'cancelada';
  creado_en: string;
  compra_entradas: EntradaComprada[];
}
