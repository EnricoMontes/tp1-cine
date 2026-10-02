import { inject, Service, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from './supabase';
import { Perfil } from '../modelos/perfil';

@Service()
export class Auth {
  private supabase = inject(Supabase);

  usuario = signal<User | null>(null);

  perfil = signal<Perfil | null>(null);

  constructor() {
    this.supabase.cliente.auth.getUser().then(({ data }) => this.guardarSesion(data.user));
  }

  async signUp(email: string, clave: string) {
    const respuesta = await this.supabase.cliente.auth.signUp({ email, password: clave });
    this.usuario.set(respuesta.data.user);
    return respuesta;
  }

  async signIn(email: string, clave: string) {
    const respuesta = await this.supabase.cliente.auth.signInWithPassword({ email, password: clave });
    await this.guardarSesion(respuesta.data.user);
    return respuesta;
  }

  async signOut() {
    const respuesta = await this.supabase.cliente.auth.signOut();
    await this.guardarSesion(null);
    return respuesta;
  }

  async crearPerfil(perfil: Perfil) {
    const respuesta = await this.supabase.cliente.from('perfiles').insert([perfil]);
    if (!respuesta.error) {
      await this.cargarPerfil(perfil.id);
    }
    return respuesta;
  }

  private async guardarSesion(usuario: User | null) {
    this.usuario.set(usuario);
    if (usuario) {
      await this.cargarPerfil(usuario.id);
    } else {
      this.perfil.set(null);
    }
  }

  private async cargarPerfil(id: string) {
    const { data } = await this.supabase.cliente.from('perfiles').select('*').eq('id', id);
    this.perfil.set(data?.[0] ?? null);
  }
}
