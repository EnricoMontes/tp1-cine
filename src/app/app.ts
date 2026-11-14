import { Component, effect, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from './servicios/auth';
import { LoginPanel } from './componentes/login-panel/login-panel';
import { Notificaciones } from './servicios/notificaciones';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoginPanel],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('cine');

  protected anio = new Date().getFullYear();

  constructor(protected auth: Auth, private router: Router, protected notificaciones: Notificaciones) {
    effect(() => {
      const usuario = this.auth.usuario();
      if (usuario) {
        this.notificaciones.empezar(usuario.id);
      } else {
        this.notificaciones.terminar();
      }
    });
  }

  async salir() {
    await this.auth.signOut();
    this.router.navigate(['/']);
  }
}
