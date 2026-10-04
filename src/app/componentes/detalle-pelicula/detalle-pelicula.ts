import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Peliculas } from '../../servicios/peliculas';
import { Pelicula } from '../../modelos/pelicula';
import { Funciones } from '../../servicios/funciones';
import { Funcion } from '../../modelos/funcion';

@Component({
  imports: [RouterLink, DatePipe],
  selector: 'app-detalle-pelicula',
  styleUrl: './detalle-pelicula.css',
  templateUrl: './detalle-pelicula.html',
})
export class DetallePelicula implements OnInit {
  pelicula = signal<Pelicula | null>(null);
  cargando = signal(true);
  mensajeError = signal('');
  funciones = signal<Funcion[]>([]);

  constructor(
    private route: ActivatedRoute,
    private peliculasService: Peliculas,
    private funcionesService: Funciones,
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
    }
    this.cargando.set(false);
  }

  private async cargarFunciones(peliculaId: number) {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    const desde = ahora.toISOString().slice(0, 16);
    const { data } = await this.funcionesService.traerPorPelicula(peliculaId, desde);
    this.funciones.set(data ?? []);
  }
}
