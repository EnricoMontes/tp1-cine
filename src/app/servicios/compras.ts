import { inject, Service } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from './supabase';

@Service()
export class Compras {
  private supabase = inject(Supabase);

  traerOcupadas(funcionId: number) {
    return this.supabase.cliente
      .from('compra_entradas')
      .select('butaca_id')
      .eq('funcion_id', funcionId);
  }

  comprar(funcionId: number, butacaIds: number[], email: string) {
    return this.supabase.cliente.rpc('comprar_entradas', {
      p_funcion_id: funcionId,
      p_butaca_ids: butacaIds,
      p_email: email,
    });
  }

  escucharVentas(funcionId: number, alVender: (butacaId: number) => void): RealtimeChannel {
    return this.supabase.cliente
      .channel(`ventas-funcion-${funcionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'compra_entradas', filter: `funcion_id=eq.${funcionId}` },
        payload => alVender(payload.new['butaca_id']),
      )
      .subscribe();
  }

  dejarDeEscuchar(canal: RealtimeChannel) {
    this.supabase.cliente.removeChannel(canal);
  }
}
