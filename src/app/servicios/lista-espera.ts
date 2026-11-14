import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';

export interface EstadoEspera {
  lugares: number;
  en_espera: number;
  mi_id: number | null;
  mi_estado: 'esperando' | 'avisado' | null;
  mi_posicion: number | null;
  mi_vence_en: string | null;
}

export interface MiEspera {
  id: number;
  funcion_id: number;
  estado: 'esperando' | 'avisado';
  vence_en: string | null;
  posicion: number;
  inicio: string;
  pelicula_id: number;
  pelicula: string;
  imagen_url: string | null;
  sala: string;
}

@Service()
export class ListaEspera {
  private supabase = inject(Supabase);

  anotarme(funcionId: number) {
    return this.supabase.cliente.rpc('anotarme_espera', { p_funcion_id: funcionId });
  }

  salir(id: number) {
    return this.supabase.cliente.from('lista_espera').delete().eq('id', id);
  }

  estado(funcionId: number) {
    return this.supabase.cliente.rpc('estado_espera', { p_funcion_id: funcionId });
  }

  mias() {
    return this.supabase.cliente.rpc('mis_esperas');
  }

  porFuncion() {
    return this.supabase.cliente.rpc('espera_por_funcion');
  }
}
