import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Carrito } from '../../servicios/carrito';
import { Compras } from '../../servicios/compras';
import { Auth } from '../../servicios/auth';
import { vencimientoValidator } from '../../validadores/pago.validadores';

@Component({
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  selector: 'app-checkout',
  styleUrl: './checkout.css',
  templateUrl: './checkout.html',
})
export class Checkout implements OnInit, OnDestroy {
  cargando = signal(false);
  mensajeError = signal('');
  compraId = signal<string | null>(null);

  restriccion = computed(() => this.carrito.funcion()?.peliculas?.restriccion_edad ?? null);
  menorBloqueado = computed(() => {
    const perfil = this.auth.perfil();
    const restriccion = this.restriccion();
    return !!restriccion && !!perfil && this.edad(perfil.fecha_nacimiento) < restriccion;
  });
  necesitaDeclaracion = computed(() => !!this.restriccion() && !this.auth.usuario());

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
    private auth: Auth,
    private router: Router,
  ) {}

  ngOnInit() {
    if (!this.carrito.funcion() || this.carrito.butacas().length === 0) {
      this.router.navigate(['/home']);
      return;
    }
    this.formPago.controls.email.setValue(this.auth.usuario()?.email ?? '');
  }

  ngOnDestroy() {
    if (this.compraId()) {
      this.carrito.vaciar();
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
    const { data, error } = await this.comprasService.comprar(funcion.id, ids, this.formPago.controls.email.value.trim());
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
