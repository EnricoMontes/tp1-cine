import { Component, computed, input, output } from '@angular/core';
import { Pelicula } from '../../modelos/pelicula';
import { Resaltar } from '../../directivas/resaltar';
import { DuracionPipe } from '../../pipes/duracion-pipe';
import { ventaAbierta } from '../../servicios/carrito';

@Component({
  imports: [Resaltar, DuracionPipe],
  selector: 'app-card-pelicula',
  styleUrl: './card-pelicula.css',
  templateUrl: './card-pelicula.html',
})
export class CardPelicula {
  pelicula = input.required<Pelicula>();

  preventaAbierta = computed(() => this.pelicula().estado === 'proximamente' && ventaAbierta(this.pelicula()));

  fechaCorta = computed(() => {
    const fecha = this.pelicula().fecha_estreno;
    if (!fecha) {
      return '';
    }
    return new Date(fecha + 'T00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '');
  });

  seleccionada = output<Pelicula>();

  seleccionar() {
    this.seleccionada.emit(this.pelicula());
  }
}
