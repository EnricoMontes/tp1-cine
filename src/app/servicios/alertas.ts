import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';
import { Pelicula } from '../modelos/pelicula';

export interface Alerta {
  id: number;
  pelicula_id: number;
  notificada: boolean;
  peliculas?: Pelicula;
}

@Service()
export class Alertas {
  private supabase = inject(Supabase);

  traerMias(usuarioId: string) {
    return this.supabase.cliente
      .from('alertas')
      .select('*, peliculas(*)')
      .eq('usuario_id', usuarioId);
  }

  activar(peliculaId: number) {
    return this.supabase.cliente.from('alertas').insert({ pelicula_id: peliculaId });
  }

  desactivar(id: number) {
    return this.supabase.cliente.from('alertas').delete().eq('id', id);
  }

  marcarNotificada(id: number) {
    return this.supabase.cliente.from('alertas').update({ notificada: true }).eq('id', id);
  }
}
