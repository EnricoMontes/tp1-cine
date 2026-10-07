import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';
import { Auth } from './auth';

@Service()
export class Actividades {
  private supabase = inject(Supabase);
  private auth = inject(Auth);

  registrar(accion: string) {
    const perfil = this.auth.perfil();
    return this.supabase.cliente
      .from('actividad')
      .insert({ usuario: `${perfil?.nombre} ${perfil?.apellido} (${perfil?.rol})`, accion });
  }

  traerTodas() {
    return this.supabase.cliente
      .from('actividad')
      .select('*')
      .order('creado_en', { ascending: false });
  }
}
