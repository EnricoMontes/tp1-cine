import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';

export interface Venta {
  creado_en: string;
  total: number;
  entradas: number;
  pelicula: string;
}

@Service()
export class Reportes {
  private supabase = inject(Supabase);

  traerVentas() {
    return this.supabase.cliente.rpc('reporte_ventas');
  }
}
