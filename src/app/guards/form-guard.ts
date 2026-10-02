import { CanDeactivateFn } from '@angular/router';
import { Registro } from '../componentes/registro/registro';

export const formGuard: CanDeactivateFn<Registro> = (component) => {
  if (component.formRegistro.dirty) {
    return confirm('Tenés datos sin guardar. ¿Seguro que querés salir?');
  }
  return true;
};
