import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';

@Service()
export class Propuestas {
  private supabase = inject(Supabase);

  proponer(titulo: string, descripcion: string, motivo: string) {
    return this.supabase.cliente.rpc('proponer_pelicula', { p_titulo: titulo, p_descripcion: descripcion, p_motivo: motivo });
  }

  traerMias(usuarioId: string) {
    return this.supabase.cliente
      .from('propuestas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });
  }

  traerTodas() {
    return this.supabase.cliente.rpc('traer_propuestas');
  }

  traerPorId(id: number) {
    return this.supabase.cliente.from('propuestas').select('*').eq('id', id);
  }

  rechazar(id: number, respuesta: string) {
    return this.supabase.cliente.rpc('rechazar_propuesta', { p_id: id, p_respuesta: respuesta });
  }

  aceptar(id: number, peliculaId: number) {
    return this.supabase.cliente.rpc('aceptar_propuesta', { p_id: id, p_pelicula_id: peliculaId });
  }
}
