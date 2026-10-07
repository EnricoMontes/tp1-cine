import { Component, computed, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Peliculas } from '../../servicios/peliculas';
import { Pelicula } from '../../modelos/pelicula';
import { Funciones } from '../../servicios/funciones';
import { Funcion } from '../../modelos/funcion';
import { Resenias } from '../../servicios/resenias';
import { Resenia } from '../../modelos/resenia';
import { Auth } from '../../servicios/auth';
import { Alerta, Alertas } from '../../servicios/alertas';
import { aperturaPreventa, enPreventa, ventaAbierta } from '../../servicios/carrito';

@Component({
  imports: [RouterLink, DatePipe, DecimalPipe, CurrencyPipe, ReactiveFormsModule],
  selector: 'app-detalle-pelicula',
  styleUrl: './detalle-pelicula.css',
  templateUrl: './detalle-pelicula.html',
})
export class DetallePelicula implements OnInit {
  pelicula = signal<Pelicula | null>(null);
  cargando = signal(true);
  mensajeError = signal('');
  funciones = signal<Funcion[]>([]);

  alerta = signal<Alerta | null>(null);

  abierta = computed(() => !!this.pelicula() && ventaAbierta(this.pelicula()!));
  preventa = computed(() => !!this.pelicula() && enPreventa(this.pelicula()!));
  apertura = computed(() => this.pelicula()?.fecha_estreno ? aperturaPreventa(this.pelicula()!) : null);

  resenias = signal<Resenia[]>([]);
  numeros = [1, 2, 3, 4, 5];
  promedio = computed(() => {
    const lista = this.resenias();
    if (lista.length === 0) {
      return 0;
    }
    let suma = 0;
    for (const resenia of lista) {
      suma += resenia.estrellas;
    }
    return suma / lista.length;
  });
  yaCalifico = computed(() => this.resenias().some(r => r.usuario_id === this.auth.usuario()?.id));
  mensajeResenia = signal('');

  formResenia = new FormGroup({
    estrellas: new FormControl(0, { nonNullable: true, validators: [Validators.min(1), Validators.max(5)] }),
    comentario: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
  });

  constructor(
    private route: ActivatedRoute,
    private peliculasService: Peliculas,
    private funcionesService: Funciones,
    private reseniasService: Resenias,
    private alertasService: Alertas,
    public auth: Auth,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarPelicula(id);
  }

  private async cargarPelicula(id: number) {
    if (!Number.isInteger(id)) {
      this.mensajeError.set('Película no encontrada.');
      this.cargando.set(false);
      return;
    }

    const { data, error } = await this.peliculasService.traerPorId(id);
    if (error) {
      this.mensajeError.set('No se pudo cargar la película. Probá de nuevo más tarde.');
    } else if (!data?.length) {
      this.mensajeError.set('Película no encontrada.');
    } else {
      this.pelicula.set(data[0]);
      await this.cargarFunciones(id);
      await this.cargarResenias(id);
      await this.cargarAlerta(id);
    }
    this.cargando.set(false);

    if (this.route.snapshot.fragment === 'calificar') {
      setTimeout(() => document.getElementById('calificar')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  private async cargarFunciones(peliculaId: number) {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    const desde = ahora.toISOString().slice(0, 16);
    const { data } = await this.funcionesService.traerPorPelicula(peliculaId, desde);
    this.funciones.set(data ?? []);
  }

  private async cargarAlerta(peliculaId: number) {
    await this.auth.sesionCargada;
    const usuario = this.auth.usuario();
    if (!usuario) {
      return;
    }
    const { data } = await this.alertasService.traerMias(usuario.id);
    this.alerta.set((data ?? []).find(a => a.pelicula_id === peliculaId) ?? null);
  }

  async cambiarAlerta() {
    const pelicula = this.pelicula()!;
    const alerta = this.alerta();
    if (alerta) {
      await this.alertasService.desactivar(alerta.id);
    } else {
      await this.alertasService.activar(pelicula.id);
    }
    await this.cargarAlerta(pelicula.id);
  }

  private async cargarResenias(peliculaId: number) {
    const { data } = await this.reseniasService.traerPorPelicula(peliculaId);
    this.resenias.set(data ?? []);
  }

  async enviarResenia() {
    this.mensajeResenia.set('');
    const pelicula = this.pelicula()!;
    const perfil = this.auth.perfil();
    const { error } = await this.reseniasService.crear({
      pelicula_id: pelicula.id,
      autor: `${perfil?.nombre} ${perfil?.apellido}`,
      estrellas: this.formResenia.controls.estrellas.value,
      comentario: this.formResenia.controls.comentario.value.trim(),
    });
    if (error) {
      this.mensajeResenia.set(error.code === '23505' ? 'Ya calificaste esta película.' : 'No se pudo guardar la reseña.');
      return;
    }
    this.formResenia.reset();
    await this.cargarResenias(pelicula.id);
  }
}
