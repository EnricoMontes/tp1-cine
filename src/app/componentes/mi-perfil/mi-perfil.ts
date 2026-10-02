import { Component } from '@angular/core';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil {
  constructor(protected auth: Auth) {}
}
