import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';
import { ComboDatos, ProductoDatos } from '../modelos/producto';

@Service()
export class Candy {
  private supabase = inject(Supabase);

  traerProductos(soloActivos: boolean) {
    let consulta = this.supabase.cliente.from('productos').select('*');
    if (soloActivos) {
      consulta = consulta.eq('activo', true);
    }
    return consulta.order('categoria').order('precio');
  }

  crearProducto(producto: ProductoDatos) {
    return this.supabase.cliente.from('productos').insert(producto);
  }

  modificarProducto(id: number, cambios: Partial<ProductoDatos>) {
    return this.supabase.cliente.from('productos').update(cambios).eq('id', id);
  }

  borrarProducto(id: number) {
    return this.supabase.cliente.from('productos').delete().eq('id', id);
  }

  traerCombos(soloActivos: boolean) {
    let consulta = this.supabase.cliente.from('combos').select('*');
    if (soloActivos) {
      consulta = consulta.eq('activo', true);
    }
    return consulta.order('precio');
  }

  crearCombo(combo: ComboDatos) {
    return this.supabase.cliente.from('combos').insert(combo);
  }

  modificarCombo(id: number, cambios: Partial<ComboDatos>) {
    return this.supabase.cliente.from('combos').update(cambios).eq('id', id);
  }

  borrarCombo(id: number) {
    return this.supabase.cliente.from('combos').delete().eq('id', id);
  }

  async subirFoto(archivo: File, carpeta: 'productos' | 'combos') {
    const path = `${carpeta}/${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    const { error } = await this.supabase.cliente.storage
      .from('candy')
      .upload(path, archivo, { cacheControl: '3600', upsert: false });
    if (error) {
      return { url: null, error };
    }

    const url = this.supabase.cliente.storage.from('candy').getPublicUrl(path).data.publicUrl;
    return { url, error: null };
  }

  traerPuntosEntrada() {
    return this.supabase.cliente.from('configuracion').select('puntos_entrada').eq('id', 1);
  }

  guardarPuntosEntrada(puntos: number) {
    return this.supabase.cliente.from('configuracion').update({ puntos_entrada: puntos }).eq('id', 1);
  }
}
