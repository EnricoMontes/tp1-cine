import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function vencimientoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value ?? '';
    if (!/^\d{2}\/\d{2}$/.test(valor)) {
      return null;
    }
    const mes = Number(valor.slice(0, 2));
    const anio = 2000 + Number(valor.slice(3, 5));
    if (mes < 1 || mes > 12) {
      return { mesInvalido: true };
    }
    if (new Date(anio, mes, 1) <= new Date()) {
      return { vencida: true };
    }
    return null;
  };
}
