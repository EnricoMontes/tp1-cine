import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

export const adminChildGuard: CanActivateChildFn = async (childRoute) => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.sesionCargada;
  const seccion = childRoute.routeConfig?.path ?? '';
  if (auth.puede(seccion)) {
    return true;
  }
  const primera = auth.seccionesPanel()[0];
  return primera ? router.createUrlTree(['/admin', primera]) : router.createUrlTree(['/']);
};
