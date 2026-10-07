import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function ponerBarras(texto: string) {
  const numeros = texto.replace(/\D/g, '').slice(0, 8);
  if (numeros.length > 4) {
    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
  }
  if (numeros.length > 2) {
    return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }
  return numeros;
}

export function ponerDosPuntos(texto: string) {
  const numeros = texto.replace(/\D/g, '').slice(0, 4);
  return numeros.length > 2 ? `${numeros.slice(0, 2)}:${numeros.slice(2)}` : numeros;
}

export function aFechaBase(fecha: string) {
  const [dia, mes, anio] = fecha.split('/');
  return `${anio}-${mes}-${dia}`;
}

export function aFechaPantalla(fecha: string) {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

export function fechaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(control.value)) {
      return { fechaInvalida: true };
    }
    const [dia, mes, anio] = control.value.split('/').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    if (fecha.getDate() !== dia || fecha.getMonth() !== mes - 1 || fecha.getFullYear() !== anio) {
      return { fechaInvalida: true };
    }
    return null;
  };
}

export function horaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    if (!/^\d{2}:\d{2}$/.test(control.value)) {
      return { horaInvalida: true };
    }
    const [hora, minutos] = control.value.split(':').map(Number);
    return hora < 24 && minutos < 60 ? null : { horaInvalida: true };
  };
}
