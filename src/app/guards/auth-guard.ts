import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

export const authGuard: CanActivateFn = async (_ruta, estado) => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.sesionCargada;

  if (auth.usuario()) {
    return true;
  }

  auth.destinoDespuesDelLogin.set(estado.url);
  auth.loginAbierto.set(true);
  return router.navigated ? false : router.createUrlTree(['/']);
};
