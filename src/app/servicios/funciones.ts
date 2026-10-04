import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';
import { FuncionDatos } from '../modelos/funcion';

@Service()
export class Funciones {
  private supabase = inject(Supabase);

  traerTodas() {
    return this.supabase.cliente
      .from('funciones')
      .select('*, peliculas(nombre), salas(nombre)')
      .order('inicio');
  }

  traerPorPelicula(peliculaId: number, desde: string) {
    return this.supabase.cliente
      .from('funciones')
      .select('*, salas(nombre)')
      .eq('pelicula_id', peliculaId)
      .gte('inicio', desde)
      .order('inicio');
  }

  traerSolapadas(salaIds: number[], inicioMenos30: string, finMas30: string) {
    return this.supabase.cliente
      .from('funciones')
      .select('sala_id')
      .in('sala_id', salaIds)
      .lt('inicio', finMas30)
      .gt('fin', inicioMenos30);
  }

  crear(funcion: FuncionDatos) {
    return this.supabase.cliente
      .from('funciones')
      .insert([funcion]);
  }

  borrar(id: number) {
    return this.supabase.cliente
      .from('funciones')
      .delete()
      .eq('id', id);
  }
}
