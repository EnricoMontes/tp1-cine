import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Funciones } from '../../servicios/funciones';
import { Salas } from '../../servicios/salas';
import { Compras } from '../../servicios/compras';
import { Carrito, enPreventa, MAXIMO_ENTRADAS, precioDeLaPelicula, RECARGO_VIP } from '../../servicios/carrito';
import { Funcion } from '../../modelos/funcion';
import { PasosCompra } from '../pasos-compra/pasos-compra';
import { Candy } from '../../servicios/candy';
import { Categoria, ItemCombo, ItemProducto } from '../../modelos/producto';

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

  combos = signal<ItemCombo[]>([]);
  productos = signal<ItemProducto[]>([]);
  categorias: Categoria[] = ['Pochoclos', 'Bebidas', 'Golosinas'];
  cantidadCombos = computed(() => {
    let suma = 0;
    for (const item of this.combos()) {
      suma += item.cantidad;
    }
    return suma;
  });
  totalCandy = computed(() => {
    let suma = 0;
    for (const item of this.combos()) {
      suma += item.cantidad * item.combo.precio;
    }
    for (const item of this.productos()) {
      suma += item.cantidad * item.producto.precio;
    }
    return suma;
  });

  libres = signal({ general: 0, accesible: 0, vip: 0 });

  precioGeneral = computed(() => precioDeLaPelicula(this.funcion()?.peliculas));
  preventa = computed(() => !!this.funcion()?.peliculas && enPreventa(this.funcion()!.peliculas!));
  precioVip = computed(() => this.precioGeneral() * RECARGO_VIP);
  cantidad = computed(() => this.general() + this.accesible() + this.vip() + this.cantidadCombos());
  total = computed(() => (this.general() + this.accesible()) * this.precioGeneral() + this.vip() * this.precioVip() + this.totalCandy());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionesService: Funciones,
    private salasService: Salas,
    private comprasService: Compras,
    private carrito: Carrito,
    private candyService: Candy,
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

    const productos = await this.candyService.traerProductos(true);
    const combos = await this.candyService.traerCombos(true);
    this.productos.set((productos.data ?? []).map(producto => ({ producto, cantidad: 0 })));
    this.combos.set((combos.data ?? []).map(combo => ({ combo, cantidad: 0 })));

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
    const usadas = tipo === 'general' ? this.general() + this.cantidadCombos() : this.contador(tipo)();
    return this.cantidad() < MAXIMO_ENTRADAS && usadas < this.libres()[tipo];
  }

  cambiarCombo(id: number, cambio: number) {
    if (cambio > 0 && !this.puedeSumar('general')) {
      return;
    }
    this.combos.update(lista => lista.map(item =>
      item.combo.id === id ? { ...item, cantidad: Math.max(0, item.cantidad + cambio) } : item
    ));
  }

  cambiarProducto(id: number, cambio: number) {
    this.productos.update(lista => lista.map(item =>
      item.producto.id === id ? { ...item, cantidad: Math.min(20, Math.max(0, item.cantidad + cambio)) } : item
    ));
  }

  productosDe(categoria: Categoria) {
    return this.productos().filter(item => item.producto.categoria === categoria);
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
    this.carrito.iniciar(funcion, this.general(), this.accesible(), this.vip(),
      this.combos().filter(item => item.cantidad > 0),
      this.productos().filter(item => item.cantidad > 0));
    this.router.navigate(['/funciones', funcion.id, 'butacas']);
  }

  private terminarConError(mensaje: string) {
    this.mensajeError.set(mensaje);
    this.cargando.set(false);
  }
}
