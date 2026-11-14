export type Seccion = 'peliculas' | 'funciones' | 'candy' | 'cupones' | 'reportes' | 'propuestas' | 'actividad';

export const SECCIONES: { valor: Seccion; texto: string }[] = [
  { valor: 'peliculas', texto: 'Películas' },
  { valor: 'funciones', texto: 'Funciones' },
  { valor: 'candy', texto: 'Candy' },
  { valor: 'cupones', texto: 'Cupones' },
  { valor: 'reportes', texto: 'Reportes' },
  { valor: 'propuestas', texto: 'Propuestas' },
  { valor: 'actividad', texto: 'Actividad' },
];

export interface RolPanel {
  id: number;
  nombre: string;
  secciones: Seccion[];
}
