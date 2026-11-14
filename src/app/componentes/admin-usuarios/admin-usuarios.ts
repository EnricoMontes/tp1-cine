import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario, Usuarios } from '../../servicios/usuarios';
import { Actividades } from '../../servicios/actividades';
import { Auth } from '../../servicios/auth';
import { Roles } from '../../servicios/roles';
import { RolPanel } from '../../modelos/rol';

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
  rolFiltro = signal('todos');
  filtrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.usuarios().filter(u =>
      `${u.nombre} ${u.apellido} ${u.email} ${u.rol}`.toLowerCase().includes(texto) &&
      (this.rolFiltro() === 'todos' || u.rol === this.rolFiltro())
    );
  });

  opcionesRol = [
    { texto: 'Todos', valor: 'todos' },
    { texto: 'Clientes', valor: 'cliente' },
    { texto: 'Empleados', valor: 'empleado' },
    { texto: 'Admins', valor: 'admin' },
  ];
  roles = ['cliente', 'empleado', 'admin'];

  cantidad(rol: string) {
    return rol === 'todos' ? this.usuarios().length : this.usuarios().filter(u => u.rol === rol).length;
  }

  iniciales(usuario: Usuario) {
    return `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase();
  }

  constructor(
    private usuariosService: Usuarios,
    private actividades: Actividades,
    public auth: Auth,
    private rolesService: Roles,
  ) {}

  rolesPanel = signal<RolPanel[]>([]);

  async asignarRolPanel(usuario: Usuario, rolId: number | null) {
    this.mensaje.set('');
    this.mensajeError.set('');
    const { error } = await this.rolesService.asignar(usuario.id, rolId);
    if (error) {
      this.mensajeError.set(error.message);
      return;
    }
    const rol = this.rolesPanel().find(r => r.id === rolId);
    const texto = rol ? `le dio el rol "${rol.nombre}"` : 'le sacó el rol del panel';
    this.actividades.registrar(`A ${usuario.nombre} ${usuario.apellido} ${texto}`);
    this.mensaje.set(rol ? `${usuario.nombre} ${usuario.apellido} ahora tiene el rol "${rol.nombre}".` : `${usuario.nombre} ${usuario.apellido} ya no entra al panel.`);
    this.cargar();
  }

  ngOnInit() {
    this.cargar();
    this.rolesService.traerTodos().then(({ data }) => this.rolesPanel.set(data ?? []));
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
