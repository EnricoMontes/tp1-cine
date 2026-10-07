import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario, Usuarios } from '../../servicios/usuarios';
import { Actividades } from '../../servicios/actividades';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [FormsModule],
  selector: 'app-admin-usuarios',
  styleUrl: './admin-usuarios.css',
  templateUrl: './admin-usuarios.html',
})
export class AdminUsuarios implements OnInit {
  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  mensaje = signal('');
  mensajeError = signal('');

  busqueda = signal('');
  filtrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.usuarios().filter(u =>
      `${u.nombre} ${u.apellido} ${u.email} ${u.rol}`.toLowerCase().includes(texto)
    );
  });

  constructor(
    private usuariosService: Usuarios,
    private actividades: Actividades,
    public auth: Auth
  ) {}

  ngOnInit() {
    this.cargar();
  }

  private async cargar() {
    const { data, error } = await this.usuariosService.traerTodos();
    if (error) {
      this.mensajeError.set('No se pudieron cargar los usuarios.');
    } else {
      this.usuarios.set(data ?? []);
    }
    this.cargando.set(false);
  }

  async cambiarRol(usuario: Usuario, nuevoRol: string) {
    this.mensaje.set('');
    this.mensajeError.set('');
    const { error } = await this.usuariosService.cambiarRol(usuario.id, nuevoRol);
    if (error) {
      this.mensajeError.set(error.message);
      return;
    }
    this.actividades.registrar(`Cambió el rol de ${usuario.nombre} ${usuario.apellido} a ${nuevoRol}`);
    this.mensaje.set(`${usuario.nombre} ${usuario.apellido} ahora es ${nuevoRol}.`);
    this.cargar();
  }
}
