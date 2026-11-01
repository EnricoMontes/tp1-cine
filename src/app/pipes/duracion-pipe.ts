import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duracion',
})
export class DuracionPipe implements PipeTransform {
  transform(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    if (!horas) {
      return `${resto} min`;
    }
    return resto ? `${horas} h ${resto} min` : `${horas} h`;
  }
}
