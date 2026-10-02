import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  formLogin = new FormGroup({
    email: new FormControl('', { validators: [Validators.required, Validators.email] }),
    clave: new FormControl('', { validators: [Validators.required] }),
  });

  mensajeError = signal('');
  cargando = signal(false);

  constructor(private auth: Auth, private router: Router) {}

  async ingresar() {
    this.mensajeError.set('');
    this.cargando.set(true);
    const datos = this.formLogin.getRawValue();

    const { error } = await this.auth.signIn(datos.email!, datos.clave!);
    this.cargando.set(false);

    if (error) {
      this.mensajeError.set(this.traducirError(error.code));
      return;
    }
    this.router.navigate(['/home']);
  }

  private traducirError(codigo?: string): string {
    switch (codigo) {
      case 'invalid_credentials':
        return 'Mail o contraseña incorrectos';
      default:
        return 'No se pudo ingresar. Intentá de nuevo más tarde';
    }
  }
}
