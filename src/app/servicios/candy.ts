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
}
