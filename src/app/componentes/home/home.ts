import { Component, computed, OnInit, signal } from '@angular/core';
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

  ranking = signal<{ pelicula_id: number; entradas_vendidas: number }[]>([]);

  masVendidas = computed(() => {
    const top: { pelicula: Pelicula; vendidas: number }[] = [];
    for (const fila of this.ranking()) {
      const pelicula = this.peliculas().find(p => p.id === fila.pelicula_id);
      if (pelicula && top.length < 3) {
        top.push({ pelicula: pelicula, vendidas: fila.entradas_vendidas });
      }
    }
    return top;
  });

  constructor(private peliculasService: Peliculas, private router: Router) {}

  ngOnInit() {
    this.cargarCartelera();
    this.cargarProximamente();
    this.cargarMasVendidas();
  }

  private async cargarMasVendidas() {
    const { data } = await this.peliculasService.traerMasVendidas();
    this.ranking.set(data ?? []);
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
