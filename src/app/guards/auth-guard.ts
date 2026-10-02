import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.sesionCargada;

  if (auth.usuario()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
