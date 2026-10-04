import { Pipe, PipeTransform } from '@angular/core';
import { Pelicula } from '../modelos/pelicula';

@Pipe({
  name: 'filtroPeliculas',
})
export class FiltroPeliculasPipe implements PipeTransform {
  transform(peliculas: Pelicula[], busqueda: string): Pelicula[] {
    const texto = busqueda.toLowerCase();

    return peliculas.filter(pelicula => {
      const coincideNombre = pelicula.nombre.toLowerCase().includes(texto);
      const coincideGenero = (pelicula.generos ?? []).some(genero => genero.nombre.toLowerCase().includes(texto));
      return coincideNombre || coincideGenero;
    });
  }
}
