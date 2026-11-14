import { computed, inject, Service, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from './supabase';
import { Perfil } from '../modelos/perfil';
import { SECCIONES } from '../modelos/rol';

@Service()
export class Auth {
  private supabase = inject(Supabase);

  usuario = signal<User | null>(null);

  perfil = signal<Perfil | null>(null);

  loginAbierto = signal(false);
  destinoDespuesDelLogin = signal<string | null>(null);

  seccionesPanel = computed<string[]>(() => {
    const perfil = this.perfil();
    if (perfil?.rol === 'admin') {
      return [...SECCIONES.map(s => s.valor), 'usuarios', 'roles'];
    }
    return perfil?.roles?.secciones ?? [];
  });

  entraAlPanel = computed(() => this.seccionesPanel().length > 0);

  puede(seccion: string) {
    return this.seccionesPanel().includes(seccion);
  }

  sesionCargada: Promise<void>;

  constructor() {
    this.sesionCargada = this.supabase.cliente.auth.getUser().then(({ data }) => this.guardarSesion(data.user));
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

  async recargarPerfil() {
    const usuario = this.usuario();
    if (usuario) {
      await this.cargarPerfil(usuario.id);
    }
  }

  private async cargarPerfil(id: string) {
    const { data } = await this.supabase.cliente.from('perfiles').select('*, roles(*)').eq('id', id);
    this.perfil.set(data?.[0] ?? null);
  }
}
