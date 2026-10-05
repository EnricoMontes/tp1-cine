import { Component, input, output } from '@angular/core';
import { Pelicula } from '../../modelos/pelicula';
import { Resaltar } from '../../directivas/resaltar';

@Component({
  imports: [Resaltar],
  selector: 'app-card-pelicula',
  styleUrl: './card-pelicula.css',
  templateUrl: './card-pelicula.html',
})
export class CardPelicula {
  pelicula = input.required<Pelicula>();

  seleccionada = output<Pelicula>();

  seleccionar() {
    this.seleccionada.emit(this.pelicula());
  }
}
