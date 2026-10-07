import { computed, Service, signal } from '@angular/core';
import { Funcion } from '../modelos/funcion';
import { Butaca } from '../modelos/sala';
import { Pelicula } from '../modelos/pelicula';
import { ItemCombo, ItemProducto } from '../modelos/producto';

export const RECARGO_VIP = 1.5;
export const MAXIMO_ENTRADAS = 10;

export function aperturaPreventa(pelicula: Pelicula) {
  const apertura = new Date(pelicula.fecha_estreno + 'T00:00');
  apertura.setDate(apertura.getDate() - 7);
  return apertura;
}

export function enPreventa(pelicula: Pelicula) {
  return !!pelicula.preventa_activa && pelicula.precio_preventa != null && !!pelicula.fecha_estreno
    && new Date() < new Date(pelicula.fecha_estreno + 'T00:00');
}

export function ventaAbierta(pelicula: Pelicula) {
  if (pelicula.estado === 'cartelera') {
    return true;
  }
  return !!pelicula.preventa_activa && !!pelicula.fecha_estreno && new Date() >= aperturaPreventa(pelicula);
}

export function precioDeLaPelicula(pelicula?: Pelicula) {
  if (!pelicula) {
    return 0;
  }
  return enPreventa(pelicula) ? pelicula.precio_preventa! : pelicula.precio_base;
}

@Service()
export class Carrito {
  funcion = signal<Funcion | null>(null);
  cantidadGeneral = signal(0);
  cantidadAccesible = signal(0);
  cantidadVip = signal(0);
  butacas = signal<Butaca[]>([]);
  combos = signal<ItemCombo[]>([]);
  productos = signal<ItemProducto[]>([]);

  precioGeneral = computed(() => precioDeLaPelicula(this.funcion()?.peliculas));
  precioVip = computed(() => this.precioGeneral() * RECARGO_VIP);

  cantidadCombos = computed(() => {
    let suma = 0;
    for (const item of this.combos()) {
      suma += item.cantidad;
    }
    return suma;
  });

  lineas = computed(() => {
    const lineas: { texto: string; monto: number }[] = [];
    const generales = this.cantidadGeneral() + this.cantidadAccesible();
    if (generales > 0) {
      lineas.push({ texto: `Entrada general × ${generales}`, monto: generales * this.precioGeneral() });
    }
    if (this.cantidadVip() > 0) {
      lineas.push({ texto: `Entrada VIP (+50%) × ${this.cantidadVip()}`, monto: this.cantidadVip() * this.precioVip() });
    }
    for (const item of this.combos()) {
      lineas.push({ texto: `${item.combo.nombre} × ${item.cantidad} (incluye la entrada)`, monto: item.cantidad * item.combo.precio });
    }
    for (const item of this.productos()) {
      lineas.push({ texto: `${item.producto.nombre} × ${item.cantidad}`, monto: item.cantidad * item.producto.precio });
    }
    return lineas;
  });

  total = computed(() => {
    let suma = 0;
    for (const linea of this.lineas()) {
      suma += linea.monto;
    }
    return suma;
  });

  productoIds = computed(() => {
    const ids: number[] = [];
    for (const item of this.productos()) {
      for (let i = 0; i < item.cantidad; i++) {
        ids.push(item.producto.id);
      }
    }
    return ids;
  });

  comboIds = computed(() => {
    const ids: number[] = [];
    for (const item of this.combos()) {
      for (let i = 0; i < item.cantidad; i++) {
        ids.push(item.combo.id);
      }
    }
    return ids;
  });

  iniciar(funcion: Funcion, cantidadGeneral: number, cantidadAccesible: number, cantidadVip: number,
          combos: ItemCombo[], productos: ItemProducto[]) {
    this.funcion.set(funcion);
    this.cantidadGeneral.set(cantidadGeneral);
    this.cantidadAccesible.set(cantidadAccesible);
    this.cantidadVip.set(cantidadVip);
    this.combos.set(combos);
    this.productos.set(productos);
    this.butacas.set([]);
  }

  elegirButacas(butacas: Butaca[]) {
    this.butacas.set(butacas);
  }

  vaciar() {
    this.funcion.set(null);
    this.cantidadGeneral.set(0);
    this.cantidadAccesible.set(0);
    this.cantidadVip.set(0);
    this.combos.set([]);
    this.productos.set([]);
    this.butacas.set([]);
  }
}
