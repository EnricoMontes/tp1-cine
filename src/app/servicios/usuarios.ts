import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'cliente' | 'empleado' | 'admin';
}

@Service()
export class Usuarios {
  private supabase = inject(Supabase);

  traerTodos() {
    return this.supabase.cliente.rpc('traer_usuarios');
  }

  cambiarRol(usuarioId: string, nuevoRol: string) {
    return this.supabase.cliente.rpc('cambiar_rol', { usuario: usuarioId, nuevo_rol: nuevoRol });
  }
}
