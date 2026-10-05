import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { adminChildGuard } from './guards/admin-child-guard';
import { empleadoGuard } from './guards/empleado-guard';
import { formGuard } from './guards/form-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./componentes/home/home').then(m => m.Home)
  },
  {
    path: 'peliculas/:id',
    loadComponent: () => import('./componentes/detalle-pelicula/detalle-pelicula').then(m => m.DetallePelicula)
  },
  {
    path: 'funciones/:id/entradas',
    loadComponent: () => import('./componentes/elegir-entradas/elegir-entradas').then(m => m.ElegirEntradas)
  },
  {
    path: 'funciones/:id/butacas',
    loadComponent: () => import('./componentes/elegir-butacas/elegir-butacas').then(m => m.ElegirButacas)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./componentes/checkout/checkout').then(m => m.Checkout)
  },
  {
    path: 'login',
    loadComponent: () => import('./componentes/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./componentes/registro/registro').then(m => m.Registro),
    canDeactivate: [formGuard]
  },
  {
    path: 'perfil',
    loadComponent: () => import('./componentes/mi-perfil/mi-perfil').then(m => m.MiPerfil),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./componentes/admin/admin').then(m => m.Admin),
    canMatch: [adminGuard],
    canActivateChild: [adminChildGuard],
    children: [
      {
        path: 'peliculas',
        loadComponent: () => import('./componentes/admin-peliculas/admin-peliculas').then(m => m.AdminPeliculas)
      },
      {
        path: 'salas',
        loadComponent: () => import('./componentes/admin-salas/admin-salas').then(m => m.AdminSalas)
      },
      {
        path: 'funciones',
        loadComponent: () => import('./componentes/admin-funciones/admin-funciones').then(m => m.AdminFunciones)
      }
    ]
  },
  {
    path: 'empleado',
    loadComponent: () => import('./componentes/empleado/empleado').then(m => m.Empleado),
    canMatch: [empleadoGuard]
  },
  {
    path: 'error',
    loadComponent: () => import('./componentes/error/error').then(m => m.Error)
  },
  {
    path: '**',
    redirectTo: 'error'
  }
];
