import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Peliculas } from '../../servicios/peliculas';
import { Genero, Pelicula, PeliculaDatos } from '../../modelos/pelicula';
import { enteroValidator } from '../../validadores/registro.validadores';
import { aFechaBase, aFechaPantalla, fechaValidator, ponerBarras } from '../../validadores/fecha.validadores';

@Component({
  imports: [ReactiveFormsModule, CurrencyPipe],
  selector: 'app-admin-peliculas',
  styleUrl: './admin-peliculas.css',
  templateUrl: './admin-peliculas.html',
})
export class AdminPeliculas implements OnInit {
  peliculas = signal<Pelicula[]>([]);
  generos = signal<Genero[]>([]);

  generosElegidos = signal<number[]>([]);

  archivoPoster = signal<File | null>(null);

  editandoId = signal<number | null>(null);

  cargando = signal(false);
  mensajeError = signal('');
  mensajeOk = signal('');

  formPelicula = new FormGroup({
    nombre: new FormControl('', { validators: [Validators.required, Validators.maxLength(100)] }),
    sinopsis: new FormControl('', { validators: [Validators.required, Validators.minLength(10)] }),
    duracionMin: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(400), enteroValidator()],
    }),
    imagenUrl: new FormControl(''),
    restriccionEdad: new FormControl(''),
    fechaEstreno: new FormControl('', { validators: [fechaValidator()] }),
    estado: new FormControl('cartelera', { validators: [Validators.required] }),
    visibleEnHome: new FormControl(true),
    precioBase: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
  });

  constructor(private peliculasService: Peliculas) {}

  ngOnInit() {
    this.cargarPeliculas();
    this.cargarGeneros();
  }

  private async cargarPeliculas() {
    const { data, error } = await this.peliculasService.traerTodas();
    if (error) {
      this.mensajeError.set('No se pudieron cargar las películas.');
      return;
    }
    this.peliculas.set(data ?? []);
  }

  private async cargarGeneros() {
    const { data } = await this.peliculasService.traerGeneros();
    this.generos.set(data ?? []);
  }

  formatearFecha(event: Event) {
    this.formPelicula.controls.fechaEstreno.setValue(ponerBarras((event.target as HTMLInputElement).value));
  }

  alternarGenero(id: number) {
    this.generosElegidos.update(lista =>
      lista.includes(id) ? lista.filter(g => g !== id) : [...lista, id]
    );
  }

  elegirArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = '';
    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith('image/')) {
      this.mensajeError.set('El póster tiene que ser una imagen (jpg, png, webp...).');
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      this.mensajeError.set('La imagen no puede pesar más de 2 MB.');
      return;
    }
    this.mensajeError.set('');
    this.archivoPoster.set(archivo);
  }

  editar(pelicula: Pelicula) {
    this.editandoId.set(pelicula.id);
    this.formPelicula.setValue({
      nombre: pelicula.nombre,
      sinopsis: pelicula.sinopsis,
      duracionMin: pelicula.duracion_min,
      imagenUrl: pelicula.imagen_url ?? '',
      restriccionEdad: pelicula.restriccion_edad ? String(pelicula.restriccion_edad) : '',
      fechaEstreno: pelicula.fecha_estreno ? aFechaPantalla(pelicula.fecha_estreno) : '',
      estado: pelicula.estado,
      visibleEnHome: pelicula.visible_en_home,
      precioBase: pelicula.precio_base,
    });
    this.generosElegidos.set((pelicula.generos ?? []).map(g => g.id));
    this.mensajeError.set('');
    this.mensajeOk.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  limpiarFormulario() {
    this.editandoId.set(null);
    this.formPelicula.reset({ estado: 'cartelera', visibleEnHome: true });
    this.generosElegidos.set([]);
    this.archivoPoster.set(null);
  }

  async guardar() {
    this.mensajeError.set('');
    this.mensajeOk.set('');

    if (this.generosElegidos().length === 0) {
      this.mensajeError.set('Elegí al menos un género.');
      return;
    }

    this.cargando.set(true);
    const valores = this.formPelicula.getRawValue();

    let imagenUrl = valores.imagenUrl || null;
    const archivo = this.archivoPoster();
    if (archivo) {
      const subida = await this.peliculasService.subirPoster(archivo);
      if (subida.error) {
        this.terminarConError('No se pudo subir el póster.');
        return;
      }
      imagenUrl = subida.url;
    }

    const datos: PeliculaDatos = {
      nombre: valores.nombre!.trim(),
      sinopsis: valores.sinopsis!.trim(),
      duracion_min: valores.duracionMin!,
      imagen_url: imagenUrl,
      restriccion_edad: valores.restriccionEdad ? (Number(valores.restriccionEdad) as 13 | 18) : null,
      fecha_estreno: valores.fechaEstreno ? aFechaBase(valores.fechaEstreno) : null,
      estado: valores.estado as 'cartelera' | 'proximamente' | 'archivada',
      visible_en_home: valores.visibleEnHome!,
      precio_base: valores.precioBase!,
    };

    let id = this.editandoId();
    if (id === null) {
      const { data, error } = await this.peliculasService.crear(datos);
      if (error || !data) {
        this.terminarConError('No se pudo crear la película.');
        return;
      }
      id = data[0].id;
    } else {
      const { error } = await this.peliculasService.modificar(id, datos);
      if (error) {
        this.terminarConError('No se pudo modificar la película.');
        return;
      }
    }

    const respuestaGeneros = await this.peliculasService.guardarGeneros(id!, this.generosElegidos());
    if (respuestaGeneros.error) {
      this.terminarConError('Se guardó la película pero fallaron los géneros.');
      return;
    }

    this.cargando.set(false);
    this.mensajeOk.set(this.editandoId() === null ? 'Película creada.' : 'Película modificada.');
    this.limpiarFormulario();
    this.cargarPeliculas();
  }

  async borrar(pelicula: Pelicula) {
    if (!confirm(`¿Borrar "${pelicula.nombre}"? No se puede deshacer.`)) {
      return;
    }
    const { error } = await this.peliculasService.borrar(pelicula.id);
    if (error) {
      this.mensajeError.set('No se pudo borrar la película.');
      return;
    }
    this.mensajeOk.set('Película borrada.');
    if (this.editandoId() === pelicula.id) {
      this.limpiarFormulario();
    }
    this.cargarPeliculas();
  }

  private terminarConError(mensaje: string) {
    this.mensajeError.set(mensaje);
    this.cargando.set(false);
  }

  nombresGeneros(pelicula: Pelicula) {
    return (pelicula.generos ?? []).map(g => g.nombre).join(', ');
  }
}
