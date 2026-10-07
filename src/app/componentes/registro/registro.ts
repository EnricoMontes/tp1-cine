import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../servicios/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { clavesCoincidenValidator, enteroValidator, fechaNacimientoValidator } from '../../validadores/registro.validadores';
import { aFechaBase, fechaValidator, ponerBarras } from '../../validadores/fecha.validadores';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  tiposSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  coloresOjos = ['Marrón', 'Negro', 'Azul', 'Verde', 'Gris', 'Miel'];

  controlClave = new FormControl('', { validators: [Validators.required, Validators.minLength(6)] });

  formRegistro = new FormGroup({
    email: new FormControl('', { validators: [Validators.required, Validators.email] }),
    clave: this.controlClave,
    confirmarClave: new FormControl('', {
      validators: [Validators.required, clavesCoincidenValidator(this.controlClave)],
    }),
    nombre: new FormControl('', {
      validators: [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/)],
    }),
    apellido: new FormControl('', {
      validators: [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/)],
    }),
    fechaNacimiento: new FormControl('', { validators: [Validators.required, fechaValidator(), fechaNacimientoValidator(120)] }),
    tipoSangre: new FormControl('', { validators: [Validators.required] }),
    colorOjos: new FormControl('', { validators: [Validators.required] }),
    diasVacaciones: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(365), enteroValidator()],
    }),
  });

  mensajeError = signal('');
  cargando = signal(false);

  constructor(private auth: Auth, private router: Router) {}

  formatearFecha(event: Event) {
    this.formRegistro.controls.fechaNacimiento.setValue(ponerBarras((event.target as HTMLInputElement).value));
  }

  async registrar() {
    this.mensajeError.set('');
    this.cargando.set(true);
    const datos = this.formRegistro.getRawValue();

    const { data, error } = await this.auth.signUp(datos.email!, datos.clave!);
    if (error || !data.user) {
      this.mensajeError.set(this.traducirError(error?.code));
      this.cargando.set(false);
      return;
    }

    const respuestaPerfil = await this.auth.crearPerfil({
      id: data.user.id,
      email: datos.email!,
      nombre: datos.nombre!,
      apellido: datos.apellido!,
      fecha_nacimiento: aFechaBase(datos.fechaNacimiento!),
      tipo_sangre: datos.tipoSangre!,
      color_ojos: datos.colorOjos!,
      dias_vacaciones: datos.diasVacaciones!,
    });
    this.cargando.set(false);
    if (respuestaPerfil.error) {
      this.mensajeError.set('Se creó el usuario pero falló al guardar el perfil: ' + respuestaPerfil.error.message);
      return;
    }

    this.formRegistro.reset();
    this.router.navigate(['/home']);
  }

  private traducirError(codigo?: string): string {
    switch (codigo) {
      case 'user_already_exists':
        return 'Ese mail ya está registrado';
      case 'email_address_invalid':
        return 'Supabase no acepta ese mail (rechaza mails de prueba como test@...). Usá un mail real';
      case 'over_email_send_rate_limit':
        return 'Se alcanzó el límite de registros por hora. Probá más tarde';
      case 'weak_password':
        return 'La contraseña es muy débil';
      default:
        return 'No se pudo registrar. Intentá de nuevo más tarde';
    }
  }
}
