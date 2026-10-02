import { inject, Service, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from './supabase';
import { Perfil } from '../modelos/perfil';

@Service()
export class Auth {
  private supabase = inject(Supabase);

  usuario = signal<User | null>(null);

  constructor() {
    this.supabase.cliente.auth.getUser().then(({ data }) => this.usuario.set(data.user));
  }

  async signUp(email: string, clave: string) {
    const respuesta = await this.supabase.cliente.auth.signUp({ email, password: clave });
    this.usuario.set(respuesta.data.user);
    return respuesta;
  }

  async signIn(email: string, clave: string) {
    const respuesta = await this.supabase.cliente.auth.signInWithPassword({ email, password: clave });
    this.usuario.set(respuesta.data.user);
    return respuesta;
  }

  async signOut() {
    const respuesta = await this.supabase.cliente.auth.signOut();
    this.usuario.set(null);
    return respuesta;
  }

  crearPerfil(perfil: Perfil) {
    return this.supabase.cliente.from('perfiles').insert([perfil]);
  }
}
