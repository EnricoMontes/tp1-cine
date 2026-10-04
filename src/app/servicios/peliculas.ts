import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';

@Service()
export class Peliculas {
  private supabase = inject(Supabase);

  traerCartelera() {
    return this.supabase.cliente
      .from('peliculas')
      .select('*, generos(*)')
      .eq('estado', 'cartelera')
      .eq('visible_en_home', true)
      .order('nombre');
  }

  traerPorId(id: number) {
    return this.supabase.cliente
      .from('peliculas')
      .select('*, generos(*)')
      .eq('id', id);
  }
}
