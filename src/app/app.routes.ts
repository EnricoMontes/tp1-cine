import { Routes } from '@angular/router';

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
    path: 'login',
    loadComponent: () => import('./componentes/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./componentes/registro/registro').then(m => m.Registro)
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
