import { Butaca } from './sala';
import { Funcion } from './funcion';

export interface EntradaComprada {
  id: number;
  precio: number;
  butacas: Butaca;
  funciones: Funcion;
}

export interface DatosEntradaPdf {
  codigo: string;
  pelicula: string;
  inicio: string;
  sala: string;
  formato: string;
  idioma: string;
  butacas: string;
  total: number;
  restriccion: number | null;
  candy: string;
}

export interface Compra {
  id: string;
  subtotal: number;
  descuento: number;
  total: number;
  puntos_ganados: number;
  estado: 'pagada' | 'cancelada';
  creado_en: string;
  validada_en: string | null;
  compra_entradas: EntradaComprada[];
  compra_productos: { cantidad: number; productos: { nombre: string } }[];
  compra_combos: { cantidad: number; combos: { nombre: string } }[];
}
