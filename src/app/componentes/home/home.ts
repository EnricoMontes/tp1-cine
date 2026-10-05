import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Peliculas } from '../../servicios/peliculas';
import { Pelicula } from '../../modelos/pelicula';
import { CardPelicula } from '../card-pelicula/card-pelicula';
import { FiltroPeliculasPipe } from '../../pipes/filtro-peliculas-pipe';

@Component({
  imports: [CardPelicula, FormsModule, FiltroPeliculasPipe],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  peliculas = signal<Pelicula[]>([]);
  proximas = signal<Pelicula[]>([]);
  cargando = signal(true);
  mensajeError = signal('');

  busqueda = signal('');

  constructor(private peliculasService: Peliculas, private router: Router) {}

  ngOnInit() {
    this.cargarCartelera();
    this.cargarProximamente();
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

  private async cargarProximamente() {
    const { data } = await this.peliculasService.traerProximamente();
    this.proximas.set(data ?? []);
  }

  verDetalle(pelicula: Pelicula) {
    this.router.navigate(['/peliculas', pelicula.id]);
  }
}
