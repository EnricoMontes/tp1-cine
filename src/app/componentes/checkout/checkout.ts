import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Carrito } from '../../servicios/carrito';
import { Compras } from '../../servicios/compras';
import { Auth } from '../../servicios/auth';
import { vencimientoValidator } from '../../validadores/pago.validadores';
import { PasosCompra } from '../pasos-compra/pasos-compra';
import { Cupones } from '../../servicios/cupones';
import { Cupon } from '../../modelos/cupon';
import { EntradaPdf } from '../../servicios/entrada-pdf';
import { Candy } from '../../servicios/candy';
import { ItemProducto } from '../../modelos/producto';

@Component({
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, PasosCompra],
  selector: 'app-checkout',
  styleUrl: './checkout.css',
  templateUrl: './checkout.html',
})
export class Checkout implements OnInit, OnDestroy {
  cargando = signal(false);
  mensajeError = signal('');
  compraId = signal<string | null>(null);
  qrImagen = signal('');

  restriccion = computed(() => this.carrito.funcion()?.peliculas?.restriccion_edad ?? null);
  menorBloqueado = computed(() => {
    const perfil = this.auth.perfil();
    const restriccion = this.restriccion();
    return !!restriccion && !!perfil && this.edad(perfil.fecha_nacimiento) < restriccion;
  });
  necesitaDeclaracion = computed(() => !!this.restriccion() && !this.auth.usuario());

  cuponesAutomaticos = signal<Cupon[]>([]);
  cuponIngresado = signal<Cupon | null>(null);
  cuponElegidoId = signal<number | null>(null);
  mensajeCupon = signal('');
  codigoCupon = new FormControl('', { nonNullable: true });

  opcionesCupon = computed(() => {
    const perfil = this.auth.perfil();
    const opciones: Cupon[] = [];
    for (const cupon of this.cuponesAutomaticos()) {
      if (cupon.tipo === 'bienvenida' && perfil && !perfil.cupon_bienvenida_usado) {
        opciones.push(cupon);
      }
      if (cupon.tipo === 'mayores_50' && perfil && this.edad(perfil.fecha_nacimiento) >= 50) {
        opciones.push(cupon);
      }
    }
    const ingresado = this.cuponIngresado();
    if (ingresado) {
      opciones.push(ingresado);
    }
    return opciones;
  });

  cuponAplicado = computed(() => {
    const opciones = this.opcionesCupon();
    const elegido = opciones.find(c => c.id === this.cuponElegidoId());
    if (elegido) {
      return elegido;
    }
    let mejor: Cupon | null = null;
    for (const cupon of opciones) {
      if (!mejor || cupon.porcentaje > mejor.porcentaje) {
        mejor = cupon;
      }
    }
    return mejor;
  });

  porcentajeBienvenida = computed(() => this.cuponesAutomaticos().find(c => c.tipo === 'bienvenida')?.porcentaje ?? null);

  puntosEntrada = signal(0);
  canjeEntradas = signal(0);
  canjeProductos = signal<ItemProducto[]>([]);
  maxEntradasCanje = computed(() => this.carrito.cantidadGeneral() + this.carrito.cantidadAccesible() + this.carrito.cantidadCombos());
  puntosUsados = computed(() => {
    let suma = this.canjeEntradas() * this.puntosEntrada();
    for (const item of this.canjeProductos()) {
      suma += item.cantidad * (item.producto.puntos ?? 0);
    }
    return suma;
  });
  puntosDisponibles = computed(() => this.auth.perfil()?.puntos ?? 0);
  descuentoCanje = computed(() => {
    let suma = this.canjeEntradas() * this.carrito.precioGeneral();
    for (const item of this.canjeProductos()) {
      suma += item.cantidad * item.producto.precio;
    }
    return suma;
  });
  subtotal = computed(() => this.carrito.total() - this.descuentoCanje());

  descuento = computed(() => {
    const cupon = this.cuponAplicado();
    return cupon ? Math.round(this.subtotal() * cupon.porcentaje) / 100 : 0;
  });
  totalAPagar = computed(() => this.subtotal() - this.descuento());

  usarCredito = signal(false);
  creditoDisponible = computed(() => this.auth.perfil()?.credito ?? 0);
  creditoUsado = computed(() => this.usarCredito() ? Math.min(this.creditoDisponible(), this.totalAPagar()) : 0);
  aPagarConTarjeta = computed(() => this.totalAPagar() - this.creditoUsado());
  puntosAGanar = computed(() => Math.floor(this.totalAPagar()));

  formPago = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    titular: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    numeroTarjeta: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{16}$/)] }),
    vencimiento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/), vencimientoValidator()],
    }),
    cvv: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{3}$/)] }),
    declaracion: new FormControl(false, { nonNullable: true }),
  });

  constructor(
    public carrito: Carrito,
    private comprasService: Compras,
    public auth: Auth,
    private router: Router,
    private cuponesService: Cupones,
    private entradaPdf: EntradaPdf,
    private candyService: Candy,
  ) {}

  ngOnInit() {
    if (!this.carrito.funcion() || this.carrito.butacas().length === 0) {
      this.router.navigate(['/home']);
      return;
    }
    this.formPago.controls.email.setValue(this.auth.usuario()?.email ?? '');
    this.cargarCupones();
    this.cargarCanje();
  }

  private async cargarCanje() {
    const { data } = await this.candyService.traerPuntosEntrada();
    this.puntosEntrada.set(data?.[0]?.puntos_entrada ?? 0);
    this.canjeProductos.set(
      this.carrito.productos().filter(item => item.producto.puntos).map(item => ({ producto: item.producto, cantidad: 0 }))
    );
  }

  alcanza(costo: number) {
    return this.puntosUsados() + costo <= this.puntosDisponibles();
  }

  cambiarCanjeEntradas(cambio: number) {
    const nuevo = this.canjeEntradas() + cambio;
    if (nuevo < 0 || nuevo > this.maxEntradasCanje() || (cambio > 0 && !this.alcanza(this.puntosEntrada()))) {
      return;
    }
    this.canjeEntradas.set(nuevo);
  }

  cambiarCanjeProducto(id: number, cambio: number) {
    this.canjeProductos.update(lista => lista.map(item => {
      if (item.producto.id !== id) {
        return item;
      }
      const comprados = this.carrito.productos().find(p => p.producto.id === id)?.cantidad ?? 0;
      const nuevo = item.cantidad + cambio;
      if (nuevo < 0 || nuevo > comprados || (cambio > 0 && !this.alcanza(item.producto.puntos ?? 0))) {
        return item;
      }
      return { ...item, cantidad: nuevo };
    }));
  }

  private canjeProductoIds() {
    const ids: number[] = [];
    for (const item of this.canjeProductos()) {
      for (let i = 0; i < item.cantidad; i++) {
        ids.push(item.producto.id);
      }
    }
    return ids;
  }

  private async cargarCupones() {
    const { data } = await this.cuponesService.traerAutomaticos();
    this.cuponesAutomaticos.set(data ?? []);
  }

  nombreCupon(cupon: Cupon) {
    if (cupon.tipo === 'bienvenida') {
      return 'Bienvenida (primera compra)';
    }
    if (cupon.tipo === 'mayores_50') {
      return 'Mayores de 50';
    }
    return `Código ${cupon.codigo}`;
  }

  async aplicarCupon() {
    this.mensajeCupon.set('');
    const codigo = this.codigoCupon.value.trim();
    if (!codigo) {
      return;
    }
    const { data } = await this.cuponesService.traerPorCodigo(codigo);
    const cupon: Cupon | undefined = data?.[0];
    if (!cupon) {
      this.mensajeCupon.set('El cupón no existe o no está activo.');
      return;
    }
    this.cuponIngresado.set(cupon);
    this.cuponElegidoId.set(cupon.id);
  }

  quitarCupon() {
    this.cuponIngresado.set(null);
    this.cuponElegidoId.set(null);
    this.codigoCupon.setValue('');
    this.mensajeCupon.set('');
  }

  ngOnDestroy() {
    if (this.compraId()) {
      this.carrito.vaciar();
      this.auth.recargarPerfil();
    }
  }

  async pagar() {
    this.mensajeError.set('');
    if (this.menorBloqueado()) {
      return;
    }
    if (this.necesitaDeclaracion() && !this.formPago.controls.declaracion.value) {
      this.mensajeError.set('Tenés que aceptar la declaración de edad para comprar esta película.');
      return;
    }

    this.cargando.set(true);
    const funcion = this.carrito.funcion()!;
    const ids = this.carrito.butacas().map(b => b.id);
    const cuponId = this.cuponAplicado()?.id ?? null;
    const { data, error } = await this.comprasService.comprar(
      funcion.id, ids, this.formPago.controls.email.value.trim(), cuponId,
      this.carrito.productoIds(), this.carrito.comboIds(),
      this.canjeEntradas(), this.canjeProductoIds(),
      this.usarCredito(),
    );
    this.cargando.set(false);

    if (error) {
      if (error.code === '23505') {
        this.mensajeError.set('Una de tus butacas la acaba de comprar otra persona. Volvé al mapa y elegí otra.');
      } else if (error.code === 'P0001') {
        this.mensajeError.set(error.message);
      } else {
        this.mensajeError.set('No se pudo realizar la compra. Probá de nuevo.');
      }
      return;
    }
    this.compraId.set(data);
    this.qrImagen.set(await this.entradaPdf.generarQr(data));
  }

  descargarPdf() {
    const funcion = this.carrito.funcion()!;
    this.entradaPdf.descargar({
      codigo: this.compraId()!,
      pelicula: funcion.peliculas?.nombre ?? '',
      inicio: funcion.inicio,
      sala: funcion.salas?.nombre ?? '',
      formato: funcion.formato,
      idioma: funcion.idioma,
      butacas: this.carrito.butacas().map(b => b.fila + b.numero).join(', '),
      total: this.totalAPagar(),
      restriccion: this.restriccion(),
      candy: this.textoCandy(),
    });
  }

  textoCandy() {
    const partes: string[] = [];
    for (const item of this.carrito.combos()) {
      partes.push(`${item.cantidad} x ${item.combo.nombre}`);
    }
    for (const item of this.carrito.productos()) {
      partes.push(`${item.cantidad} x ${item.producto.nombre}`);
    }
    return partes.join(', ');
  }

  soloNumeros(event: Event, campo: 'numeroTarjeta' | 'cvv') {
    const input = event.target as HTMLInputElement;
    this.formPago.controls[campo].setValue(input.value.replace(/\D/g, ''));
  }

  formatearVencimiento(event: Event) {
    const input = event.target as HTMLInputElement;
    const numeros = input.value.replace(/\D/g, '').slice(0, 4);
    const conBarra = numeros.length > 2 ? `${numeros.slice(0, 2)}/${numeros.slice(2)}` : numeros;
    this.formPago.controls.vencimiento.setValue(conBarra);
  }

  private edad(fechaNacimiento: string) {
    const nacimiento = new Date(fechaNacimiento + 'T00:00');
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const todaviaNoCumplio =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
    if (todaviaNoCumplio) {
      edad--;
    }
    return edad;
  }
}
