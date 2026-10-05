import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Funciones } from '../../servicios/funciones';
import { Carrito, MAXIMO_ENTRADAS, RECARGO_VIP } from '../../servicios/carrito';
import { Funcion } from '../../modelos/funcion';

@Component({
  imports: [RouterLink, CurrencyPipe, DatePipe],
  selector: 'app-elegir-entradas',
  styleUrl: './elegir-entradas.css',
  templateUrl: './elegir-entradas.html',
})
export class ElegirEntradas implements OnInit {
  funcion = signal<Funcion | null>(null);
  cargando = signal(true);
  mensajeError = signal('');

  general = signal(0);
  vip = signal(0);

  maximo = MAXIMO_ENTRADAS;

  precioGeneral = computed(() => this.funcion()?.peliculas?.precio_base ?? 0);
  precioVip = computed(() => this.precioGeneral() * RECARGO_VIP);
  cantidad = computed(() => this.general() + this.vip());
  total = computed(() => this.general() * this.precioGeneral() + this.vip() * this.precioVip());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionesService: Funciones,
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
    this.cargando.set(false);
  }

  sumar(tipo: 'general' | 'vip') {
    if (this.cantidad() >= MAXIMO_ENTRADAS) {
      return;
    }
    const contador = tipo === 'general' ? this.general : this.vip;
    contador.update(n => n + 1);
  }

  restar(tipo: 'general' | 'vip') {
    const contador = tipo === 'general' ? this.general : this.vip;
    contador.update(n => Math.max(0, n - 1));
  }

  continuar() {
    const funcion = this.funcion();
    if (!funcion || this.cantidad() === 0) {
      return;
    }
    this.carrito.iniciar(funcion, this.general(), this.vip());
    this.router.navigate(['/funciones', funcion.id, 'butacas']);
  }

  private terminarConError(mensaje: string) {
    this.mensajeError.set(mensaje);
    this.cargando.set(false);
  }
}
