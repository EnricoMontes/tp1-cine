import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Funciones } from '../../servicios/funciones';
import { Salas } from '../../servicios/salas';
import { Compras } from '../../servicios/compras';
import { Carrito } from '../../servicios/carrito';
import { Funcion } from '../../modelos/funcion';
import { Butaca } from '../../modelos/sala';
import { MapaButacas } from '../mapa-butacas/mapa-butacas';
import { PasosCompra } from '../pasos-compra/pasos-compra';

@Component({
  imports: [RouterLink, DatePipe, MapaButacas, PasosCompra],
  selector: 'app-elegir-butacas',
  styleUrl: './elegir-butacas.css',
  templateUrl: './elegir-butacas.html',
})
export class ElegirButacas implements OnInit, OnDestroy {
  funcion = signal<Funcion | null>(null);
  butacas = signal<Butaca[]>([]);
  ocupadas = signal<number[]>([]);
  seleccionadas = signal<Butaca[]>([]);

  cargando = signal(true);
  mensajeError = signal('');
  aviso = signal('');

  private canal: RealtimeChannel | null = null;

  constructor(
    private route: ActivatedRoute,
    private funcionesService: Funciones,
    private salasService: Salas,
    private comprasService: Compras,
    public carrito: Carrito,
    private router: Router,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.carrito.funcion()?.id !== id) {
      this.router.navigate(['/funciones', id, 'entradas']);
      return;
    }
    this.seleccionadas.set(this.carrito.butacas());
    this.cargar(id);
  }

  tipos: { tipo: Butaca['tipo']; nombre: string }[] = [
    { tipo: 'normal', nombre: 'generales' },
    { tipo: 'accesible', nombre: 'accesibles' },
    { tipo: 'vip', nombre: 'VIP' },
  ];

  elegidas(tipo: Butaca['tipo']) {
    return this.seleccionadas().filter(b => b.tipo === tipo).length;
  }

  cupo(tipo: Butaca['tipo']) {
    if (tipo === 'accesible') {
      return this.carrito.cantidadAccesible();
    }
    return tipo === 'vip' ? this.carrito.cantidadVip() : this.carrito.cantidadGeneral() + this.carrito.cantidadCombos();
  }

  completo() {
    return this.tipos.every(t => this.elegidas(t.tipo) === this.cupo(t.tipo));
  }

  ngOnDestroy() {
    if (this.canal) {
      this.comprasService.dejarDeEscuchar(this.canal);
    }
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
      this.terminarConError('No se pudieron cargar las butacas.');
      return;
    }
    this.butacas.set(butacas.data ?? []);
    this.ocupadas.set((ocupadas.data ?? []).map(e => e.butaca_id));

    this.canal = this.comprasService.escucharVentas(id, butacaId => this.marcarVendida(butacaId));
    this.cargando.set(false);
  }

  private marcarVendida(butacaId: number) {
    this.ocupadas.update(lista => [...lista, butacaId]);

    const perdida = this.seleccionadas().find(b => b.id === butacaId);
    if (perdida) {
      this.seleccionadas.update(lista => lista.filter(b => b.id !== butacaId));
      this.aviso.set(`La butaca ${perdida.fila}${perdida.numero} la acaba de comprar otra persona.`);
    }
  }

  alternar(butaca: Butaca) {
    this.aviso.set('');
    if (this.seleccionadas().some(b => b.id === butaca.id)) {
      this.seleccionadas.update(lista => lista.filter(b => b.id !== butaca.id));
      return;
    }
    const cupo = this.cupo(butaca.tipo);
    if (this.elegidas(butaca.tipo) >= cupo) {
      const nombre = this.tipos.find(t => t.tipo === butaca.tipo)!.nombre;
      this.aviso.set(cupo === 0
        ? `No sacaste entradas ${nombre}. Volvé a las entradas si querés una.`
        : `Ya marcaste tus ${cupo} butacas ${nombre}. Desmarcá una para cambiarla.`);
      return;
    }
    this.seleccionadas.update(lista => [...lista, butaca]);
  }

  continuar() {
    if (!this.completo()) {
      return;
    }
    this.carrito.elegirButacas(this.seleccionadas());
    this.router.navigate(['/checkout']);
  }

  idsSeleccionadas() {
    return this.seleccionadas().map(b => b.id);
  }

  private terminarConError(mensaje: string) {
    this.mensajeError.set(mensaje);
    this.cargando.set(false);
  }
}
