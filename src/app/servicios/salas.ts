import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';

@Service()
export class Salas {
  private supabase = inject(Supabase);

  traerSalas() {
    return this.supabase.cliente
      .from('salas')
      .select('*')
      .order('id');
  }

  traerButacas(salaId: number) {
    return this.supabase.cliente
      .from('butacas')
      .select('*')
      .eq('sala_id', salaId)
      .order('fila')
      .order('numero');
  }
}
