export type Categoria = 'Pochoclos' | 'Bebidas' | 'Golosinas';

export interface ProductoDatos {
  nombre: string;
  categoria: Categoria;
  precio: number;
  activo: boolean;
  puntos?: number | null;
}

export interface Producto extends ProductoDatos {
  id: number;
  vendidos: number;
}

export interface ComboDatos {
  nombre: string;
  incluye: string;
  precio: number;
  activo: boolean;
}

export interface Combo extends ComboDatos {
  id: number;
  vendidos: number;
}

export interface ItemProducto {
  producto: Producto;
  cantidad: number;
}

export interface ItemCombo {
  combo: Combo;
  cantidad: number;
}

export interface Canje {
  id: number;
  descripcion: string;
  puntos: number;
  creado_en: string;
}
