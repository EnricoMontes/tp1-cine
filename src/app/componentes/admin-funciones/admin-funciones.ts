import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Funciones } from '../../servicios/funciones';
import { Peliculas } from '../../servicios/peliculas';
import { Salas } from '../../servicios/salas';
import { Funcion } from '../../modelos/funcion';
import { Pelicula } from '../../modelos/pelicula';
import { Formato } from '../../modelos/sala';

@Component({
  imports: [ReactiveFormsModule, DatePipe],
  selector: 'app-admin-funciones',
  styleUrl: './admin-funciones.css',
  templateUrl: './admin-funciones.html',
})
export class AdminFunciones implements OnInit {
  funciones = signal<Funcion[]>([]);
  peliculas = signal<Pelicula[]>([]);

  formatos: Formato[] = ['2D', '3D', '4D', '5D'];

  cargando = signal(false);
  mensajeError = signal('');
  mensajeOk = signal('');

  formFuncion = new FormGroup({
    peliculaId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    formato: new FormControl<Formato>('2D', { nonNullable: true, validators: [Validators.required] }),
    idioma: new FormControl<'castellano' | 'subtitulada'>('castellano', { nonNullable: true }),
    inicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(
    private funcionesService: Funciones,
    private peliculasService: Peliculas,
    private salasService: Salas,
  ) {}

  ngOnInit() {
    this.cargarFunciones();
    this.cargarPeliculas();
  }

  private async cargarFunciones() {
    const { data, error } = await this.funcionesService.traerTodas();
    if (error) {
      this.mensajeError.set('No se pudieron cargar las funciones.');
      return;
    }
    this.funciones.set(data ?? []);
  }

  private async cargarPeliculas() {
    const { data } = await this.peliculasService.traerTodas();
    this.peliculas.set((data ?? []).filter(p => p.estado === 'cartelera'));
  }

  async guardar() {
    this.mensajeError.set('');
    this.mensajeOk.set('');

    const valores = this.formFuncion.getRawValue();
    const pelicula = this.peliculas().find(p => p.id === Number(valores.peliculaId));
    if (!pelicula) {
      this.mensajeError.set('Elegí una película.');
      return;
    }

    if (new Date(valores.inicio) <= new Date()) {
      this.mensajeError.set('La función tiene que ser en el futuro.');
      return;
    }

    this.cargando.set(true);

    const inicio = valores.inicio;
    const fin = this.sumarMinutos(inicio, pelicula.duracion_min);

    const salas = await this.salasService.traerPorFormato(valores.formato);
    if (salas.error || !salas.data?.length) {
      this.terminarConError(`No hay salas ${valores.formato}.`);
      return;
    }

    const ids = salas.data.map(s => s.id);
    const solapadas = await this.funcionesService.traerSolapadas(
      ids,
      this.sumarMinutos(inicio, -30),
      this.sumarMinutos(fin, 30),
    );
    if (solapadas.error) {
      this.terminarConError('No se pudo verificar la disponibilidad de las salas.');
      return;
    }
    const ocupadas = solapadas.data.map(f => f.sala_id);

    const salaLibre = salas.data.find(s => !ocupadas.includes(s.id));
    if (!salaLibre) {
      this.terminarConError(`No hay salas ${valores.formato} libres en ese horario (se necesitan 30 min entre funciones).`);
      return;
    }

    const { error } = await this.funcionesService.crear({
      pelicula_id: pelicula.id,
      sala_id: salaLibre.id,
      inicio,
      fin,
      formato: valores.formato,
      idioma: valores.idioma,
    });
    if (error) {
      this.terminarConError(error.code === '23P01'
        ? 'Esa sala se acaba de ocupar en ese horario. Probá de nuevo.'
        : 'No se pudo crear la función.');
      return;
    }

    this.cargando.set(false);
    this.mensajeOk.set(`Función creada: ${pelicula.nombre} en ${salaLibre.nombre} (${valores.formato}).`);
    this.formFuncion.reset();
    await this.cargarFunciones();
  }

  async borrar(funcion: Funcion) {
    if (!confirm(`¿Borrar la función de ${funcion.peliculas?.nombre}?`)) {
      return;
    }
    const { error } = await this.funcionesService.borrar(funcion.id);
    if (error) {
      this.mensajeError.set('No se pudo borrar la función.');
      return;
    }
    await this.cargarFunciones();
  }

  private terminarConError(mensaje: string) {
    this.mensajeError.set(mensaje);
    this.cargando.set(false);
  }

  private sumarMinutos(fecha: string, minutos: number) {
    const d = new Date(fecha);
    d.setMinutes(d.getMinutes() + minutos);
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
  }
}
