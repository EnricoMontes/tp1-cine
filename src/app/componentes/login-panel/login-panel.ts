import { Component } from '@angular/core';
import { Login } from '../login/login';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [Login],
  selector: 'app-login-panel',
  styleUrl: './login-panel.css',
  templateUrl: './login-panel.html',
})
export class LoginPanel {
  constructor(protected auth: Auth) {}

  cerrar() {
    this.auth.loginAbierto.set(false);
  }
}
