import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Peliculas } from '../../servicios/peliculas';
import { Pelicula } from '../../modelos/pelicula';

@Component({
  imports: [RouterLink],
  selector: 'app-detalle-pelicula',
  styleUrl: './detalle-pelicula.css',
  templateUrl: './detalle-pelicula.html',
})
export class DetallePelicula implements OnInit {
  pelicula = signal<Pelicula | null>(null);
  cargando = signal(true);
  mensajeError = signal('');

  constructor(private route: ActivatedRoute, private peliculasService: Peliculas) {}

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
    }
    this.cargando.set(false);
  }
}
