import { Formato, Sala } from './sala';
import { Pelicula } from './pelicula';

export interface FuncionDatos {
  pelicula_id: number;
  sala_id: number;
  inicio: string;
  fin: string;
  formato: Formato;
  idioma: 'castellano' | 'subtitulada';
}

export interface Funcion extends FuncionDatos {
  id: number;
  peliculas?: Pelicula;
  salas?: Sala;
}
