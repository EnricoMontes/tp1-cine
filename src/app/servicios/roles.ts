import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';
import { Seccion } from '../modelos/rol';

@Service()
export class Roles {
  private supabase = inject(Supabase);

  traerTodos() {
    return this.supabase.cliente.from('roles').select('*').order('nombre');
  }

  crear(nombre: string, secciones: Seccion[]) {
    return this.supabase.cliente.from('roles').insert({ nombre, secciones });
  }

  modificar(id: number, nombre: string, secciones: Seccion[]) {
    return this.supabase.cliente.from('roles').update({ nombre, secciones }).eq('id', id);
  }

  borrar(id: number) {
    return this.supabase.cliente.from('roles').delete().eq('id', id);
  }

  asignar(usuarioId: string, rolId: number | null) {
    return this.supabase.cliente.rpc('asignar_rol_panel', { p_usuario: usuarioId, p_rol_id: rolId });
  }
}
