import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Funcion } from '../../modelos/funcion';

@Component({
  imports: [DatePipe],
  selector: 'app-cabecera-funcion',
  styleUrl: './cabecera-funcion.css',
  templateUrl: './cabecera-funcion.html',
})
export class CabeceraFuncion {
  funcion = input.required<Funcion>();

  private dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  diaSemana() {
    return this.dias[new Date(this.funcion().inicio).getDay()];
  }
}
