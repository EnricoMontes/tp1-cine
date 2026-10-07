import { Component, computed, input, output } from '@angular/core';
import { Pelicula } from '../../modelos/pelicula';
import { Resaltar } from '../../directivas/resaltar';
import { ventaAbierta } from '../../servicios/carrito';

@Component({
  imports: [Resaltar],
  selector: 'app-card-pelicula',
  styleUrl: './card-pelicula.css',
  templateUrl: './card-pelicula.html',
})
export class CardPelicula {
  pelicula = input.required<Pelicula>();

  preventaAbierta = computed(() => this.pelicula().estado === 'proximamente' && ventaAbierta(this.pelicula()));

  seleccionada = output<Pelicula>();

  seleccionar() {
    this.seleccionada.emit(this.pelicula());
  }
}
