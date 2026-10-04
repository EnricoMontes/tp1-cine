import { Component, computed, input } from '@angular/core';
import { Butaca } from '../../modelos/sala';

interface FilaMapa {
  letra: string;
  bloques: Butaca[][];
}

@Component({
  imports: [],
  selector: 'app-mapa-butacas',
  styleUrl: './mapa-butacas.css',
  templateUrl: './mapa-butacas.html',
})
export class MapaButacas {
  butacas = input.required<Butaca[]>();

  filas = computed(() => {
    const filas: FilaMapa[] = [];
    for (const butaca of this.butacas()) {
      let fila = filas[filas.length - 1];
      if (!fila || fila.letra !== butaca.fila) {
        fila = { letra: butaca.fila, bloques: [[], [], []] };
        filas.push(fila);
      }
      fila.bloques[butaca.columna - 1].push(butaca);
    }
    return filas;
  });
}
