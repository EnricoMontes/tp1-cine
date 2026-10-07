import { computed, Service, signal } from '@angular/core';
import { Funcion } from '../modelos/funcion';
import { Butaca } from '../modelos/sala';
import { Pelicula } from '../modelos/pelicula';

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

  precioGeneral = computed(() => precioDeLaPelicula(this.funcion()?.peliculas));
  precioVip = computed(() => this.precioGeneral() * RECARGO_VIP);

  total = computed(() =>
    (this.cantidadGeneral() + this.cantidadAccesible()) * this.precioGeneral() + this.cantidadVip() * this.precioVip()
  );

  precioDe(butaca: Butaca) {
    return butaca.tipo === 'vip' ? this.precioVip() : this.precioGeneral();
  }

  iniciar(funcion: Funcion, cantidadGeneral: number, cantidadAccesible: number, cantidadVip: number) {
    this.funcion.set(funcion);
    this.cantidadGeneral.set(cantidadGeneral);
    this.cantidadAccesible.set(cantidadAccesible);
    this.cantidadVip.set(cantidadVip);
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
    this.butacas.set([]);
  }
}
