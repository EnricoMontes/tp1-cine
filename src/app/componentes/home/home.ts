import { Component, OnInit, signal } from '@angular/core';
import { Peliculas } from '../../servicios/peliculas';
import { Pelicula } from '../../modelos/pelicula';

@Component({
  imports: [],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  peliculas = signal<Pelicula[]>([]);
  cargando = signal(true);
  mensajeError = signal('');

  constructor(private peliculasService: Peliculas) {}

  ngOnInit() {
    this.cargarCartelera();
  }

  private async cargarCartelera() {
    const { data, error } = await this.peliculasService.traerCartelera();
    if (error) {
      this.mensajeError.set('No se pudo cargar la cartelera. Probá de nuevo más tarde.');
    } else {
      this.peliculas.set(data ?? []);
    }
    this.cargando.set(false);
  }
}
