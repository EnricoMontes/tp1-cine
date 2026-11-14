import { Component } from '@angular/core';
import { Auth } from '../../servicios/auth';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-admin',
  styleUrl: './admin.css',
  templateUrl: './admin.html',
})
export class Admin {
  constructor(protected auth: Auth) {}

  pestanias = [
    { ruta: 'peliculas', texto: 'Películas' },
    { ruta: 'funciones', texto: 'Funciones' },
    { ruta: 'candy', texto: 'Candy' },
    { ruta: 'cupones', texto: 'Cupones' },
    { ruta: 'reportes', texto: 'Reportes' },
    { ruta: 'propuestas', texto: 'Propuestas' },
    { ruta: 'usuarios', texto: 'Usuarios' },
    { ruta: 'roles', texto: 'Roles' },
    { ruta: 'actividad', texto: 'Actividad' },
  ];
}
