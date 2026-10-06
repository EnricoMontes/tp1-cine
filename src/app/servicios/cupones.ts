import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';

@Service()
export class Cupones {
  private supabase = inject(Supabase);

  traerTodos() {
    return this.supabase.cliente
      .from('cupones')
      .select('*')
      .order('tipo')
      .order('codigo');
  }

  traerAutomaticos() {
    return this.supabase.cliente
      .from('cupones')
      .select('*')
      .in('tipo', ['bienvenida', 'mayores_50'])
      .eq('activo', true);
  }

  traerPorCodigo(codigo: string) {
    return this.supabase.cliente
      .from('cupones')
      .select('*')
      .ilike('codigo', codigo)
      .eq('tipo', 'codigo')
      .eq('activo', true);
  }

  crear(tipo: 'mayores_50' | 'codigo', codigo: string | null, porcentaje: number) {
    return this.supabase.cliente
      .from('cupones')
      .insert([{ tipo: tipo, codigo: codigo, porcentaje: porcentaje }]);
  }

  modificar(id: number, cambios: { porcentaje?: number; activo?: boolean }) {
    return this.supabase.cliente
      .from('cupones')
      .update(cambios)
      .eq('id', id);
  }

  borrar(id: number) {
    return this.supabase.cliente
      .from('cupones')
      .delete()
      .eq('id', id);
  }
}
