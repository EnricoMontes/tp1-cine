import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';
import { Perfil } from '../modelos/perfil';

@Service()
export class Auth {
  private supabase = inject(Supabase);

  signUp(email: string, clave: string) {
    return this.supabase.cliente.auth.signUp({ email, password: clave });
  }

  crearPerfil(perfil: Perfil) {
    return this.supabase.cliente.from('perfiles').insert([perfil]);
  }
}
