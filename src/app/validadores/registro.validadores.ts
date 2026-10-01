import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function clavesCoincidenValidator(controlACoincidir: AbstractControl): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valorControl = control.value;
    const valorControlCoincidir = controlACoincidir.value;
    if (valorControl !== valorControlCoincidir) {
      return { losControlesNoCoinciden: true };
    } else {
      return null;
    }
  };
}

export function fechaNacimientoValidator(edadMaxima: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const fechaNacimiento = new Date(control.value);
    const hoy = new Date();

    if (fechaNacimiento > hoy) {
      return { fechaFutura: true };
    }

    const fechaLimite = new Date();
    fechaLimite.setFullYear(hoy.getFullYear() - edadMaxima);
    if (fechaNacimiento < fechaLimite) {
      return { edadInvalida: true };
    }

    return null;
  };
}

export function enteroValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === '') {
      return null;
    }
    if (!Number.isInteger(Number(control.value))) {
      return { noEsEntero: true };
    } else {
      return null;
    }
  };
}
