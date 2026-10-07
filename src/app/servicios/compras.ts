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
      .eq('funcion_id', funcionId)
      .eq('cancelada', false);
  }

  comprar(funcionId: number, butacaIds: number[], email: string, cuponId: number | null,
          productoIds: number[], comboIds: number[], canjeEntradas: number, canjeProductoIds: number[], usarCredito: boolean) {
    return this.supabase.cliente.rpc('comprar_entradas', {
      p_funcion_id: funcionId,
      p_butaca_ids: butacaIds,
      p_email: email,
      p_producto_ids: productoIds,
      p_combo_ids: comboIds,
      p_canje_entradas: canjeEntradas,
      p_canje_producto_ids: canjeProductoIds,
      p_usar_credito: usarCredito,
      p_cupon_id: cuponId,
    });
  }

  traerMisCompras(usuarioId: string) {
    return this.supabase.cliente
      .from('compras')
      .select('*, compra_entradas(id, precio, butacas(*), funciones(*, peliculas(nombre, imagen_url, restriccion_edad), salas(nombre))), compra_productos(cantidad, productos(nombre)), compra_combos(cantidad, combos(nombre))')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });
  }

  cancelar(codigo: string) {
    return this.supabase.cliente.rpc('cancelar_compra', { p_codigo: codigo });
  }

  traerMisCanjes(usuarioId: string) {
    return this.supabase.cliente
      .from('canjes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });
  }

  validar(codigo: string) {
    return this.supabase.cliente.rpc('validar_entrada', { p_codigo: codigo });
  }

  entregarCandy(codigo: string) {
    return this.supabase.cliente.rpc('entregar_candy', { p_codigo: codigo });
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
