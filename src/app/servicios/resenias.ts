import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';
import { ReseniaDatos } from '../modelos/resenia';

@Service()
export class Resenias {
  private supabase = inject(Supabase);

  traerPorPelicula(peliculaId: number) {
    return this.supabase.cliente
      .from('resenias')
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('creado_en', { ascending: false });
  }

  traerDeUsuario(usuarioId: string) {
    return this.supabase.cliente
      .from('resenias')
      .select('*')
      .eq('usuario_id', usuarioId);
  }

  crear(resenia: ReseniaDatos) {
    return this.supabase.cliente.from('resenias').insert(resenia);
  }
}
