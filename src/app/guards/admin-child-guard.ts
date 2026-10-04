import { inject } from '@angular/core';
import { CanActivateChildFn } from '@angular/router';
import { Auth } from '../servicios/auth';

export const adminChildGuard: CanActivateChildFn = async () => {
  const auth = inject(Auth);
  await auth.sesionCargada;
  return auth.perfil()?.rol === 'admin';
};
