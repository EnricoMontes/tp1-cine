import { RolPanel } from './rol';

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  tipo_sangre: string;
  color_ojos: string;
  dias_vacaciones: number;
  rol?: 'cliente' | 'empleado' | 'admin';
  rol_id?: number | null;
  roles?: RolPanel | null;
  puntos?: number;
  credito?: number;
  cupon_bienvenida_usado?: boolean;
}
