import { computed, Service, signal } from '@angular/core';
import { Funcion } from '../modelos/funcion';
import { Butaca } from '../modelos/sala';

export const RECARGO_VIP = 1.5;
export const MAXIMO_ENTRADAS = 10;

@Service()
export class Carrito {
  funcion = signal<Funcion | null>(null);
  cantidadGeneral = signal(0);
  cantidadVip = signal(0);
  butacas = signal<Butaca[]>([]);

  precioGeneral = computed(() => this.funcion()?.peliculas?.precio_base ?? 0);
  precioVip = computed(() => this.precioGeneral() * RECARGO_VIP);

  total = computed(() => this.cantidadGeneral() * this.precioGeneral() + this.cantidadVip() * this.precioVip());

  precioDe(butaca: Butaca) {
    return butaca.tipo === 'vip' ? this.precioVip() : this.precioGeneral();
  }

  iniciar(funcion: Funcion, cantidadGeneral: number, cantidadVip: number) {
    this.funcion.set(funcion);
    this.cantidadGeneral.set(cantidadGeneral);
    this.cantidadVip.set(cantidadVip);
    this.butacas.set([]);
  }

  elegirButacas(butacas: Butaca[]) {
    this.butacas.set(butacas);
  }

  vaciar() {
    this.funcion.set(null);
    this.cantidadGeneral.set(0);
    this.cantidadVip.set(0);
    this.butacas.set([]);
  }
}
