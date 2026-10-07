import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Funciones } from '../../servicios/funciones';
import { Salas } from '../../servicios/salas';
import { Compras } from '../../servicios/compras';
import { Carrito, enPreventa, MAXIMO_ENTRADAS, precioDeLaPelicula, RECARGO_VIP } from '../../servicios/carrito';
import { Funcion } from '../../modelos/funcion';
import { PasosCompra } from '../pasos-compra/pasos-compra';

@Component({
  imports: [RouterLink, CurrencyPipe, DatePipe, PasosCompra],
  selector: 'app-elegir-entradas',
  styleUrl: './elegir-entradas.css',
  templateUrl: './elegir-entradas.html',
})
export class ElegirEntradas implements OnInit {
  funcion = signal<Funcion | null>(null);
  cargando = signal(true);
  mensajeError = signal('');

  general = signal(0);
  accesible = signal(0);
  vip = signal(0);

  maximo = MAXIMO_ENTRADAS;

  libres = signal({ general: 0, accesible: 0, vip: 0 });

  precioGeneral = computed(() => precioDeLaPelicula(this.funcion()?.peliculas));
  preventa = computed(() => !!this.funcion()?.peliculas && enPreventa(this.funcion()!.peliculas!));
  precioVip = computed(() => this.precioGeneral() * RECARGO_VIP);
  cantidad = computed(() => this.general() + this.accesible() + this.vip());
  total = computed(() => (this.general() + this.accesible()) * this.precioGeneral() + this.vip() * this.precioVip());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionesService: Funciones,
    private salasService: Salas,
    private comprasService: Compras,
    private carrito: Carrito,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(id);
  }

  private async cargar(id: number) {
    if (!Number.isInteger(id)) {
      this.terminarConError('Función no encontrada.');
      return;
    }
    const { data, error } = await this.funcionesService.traerPorId(id);
    if (error) {
      this.terminarConError('No se pudo cargar la función.');
      return;
    }
    if (!data?.length) {
      this.terminarConError('Función no encontrada.');
      return;
    }
    const funcion: Funcion = data[0];
    if (new Date(funcion.inicio) <= new Date()) {
      this.terminarConError('Esta función ya empezó: no se pueden comprar entradas.');
      return;
    }
    this.funcion.set(funcion);

    const butacas = await this.salasService.traerButacas(funcion.sala_id);
    const ocupadas = await this.comprasService.traerOcupadas(id);
    if (butacas.error || ocupadas.error) {
      this.terminarConError('No se pudo ver la disponibilidad de butacas.');
      return;
    }
    const idsOcupadas = (ocupadas.data ?? []).map(e => e.butaca_id);
    const libres = (butacas.data ?? []).filter(b => !idsOcupadas.includes(b.id));
    this.libres.set({
      general: libres.filter(b => b.tipo === 'normal').length,
      accesible: libres.filter(b => b.tipo === 'accesible').length,
      vip: libres.filter(b => b.tipo === 'vip').length,
    });
    this.cargando.set(false);
  }

  puedeSumar(tipo: 'general' | 'accesible' | 'vip') {
    return this.cantidad() < MAXIMO_ENTRADAS && this.contador(tipo)() < this.libres()[tipo];
  }

  sumar(tipo: 'general' | 'accesible' | 'vip') {
    if (!this.puedeSumar(tipo)) {
      return;
    }
    this.contador(tipo).update(n => n + 1);
  }

  restar(tipo: 'general' | 'accesible' | 'vip') {
    this.contador(tipo).update(n => Math.max(0, n - 1));
  }

  private contador(tipo: 'general' | 'accesible' | 'vip') {
    if (tipo === 'accesible') {
      return this.accesible;
    }
    return tipo === 'vip' ? this.vip : this.general;
  }

  continuar() {
    const funcion = this.funcion();
    if (!funcion || this.cantidad() === 0) {
      return;
    }
    this.carrito.iniciar(funcion, this.general(), this.accesible(), this.vip());
    this.router.navigate(['/funciones', funcion.id, 'butacas']);
  }

  private terminarConError(mensaje: string) {
    this.mensajeError.set(mensaje);
    this.cargando.set(false);
  }
}
