import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { Auth } from '../servicios/auth';

export const adminGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  await auth.sesionCargada;
  return auth.perfil()?.rol === 'admin';
};
