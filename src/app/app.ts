import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from './servicios/auth';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('cine');

  constructor(protected auth: Auth, private router: Router) {}

  async salir() {
    await this.auth.signOut();
    this.router.navigate(['/home']);
  }
}
