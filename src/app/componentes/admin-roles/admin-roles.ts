import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Roles } from '../../servicios/roles';
import { Usuarios, Usuario } from '../../servicios/usuarios';
import { Actividades } from '../../servicios/actividades';
import { RolPanel, Seccion, SECCIONES } from '../../modelos/rol';

@Component({
  imports: [FormsModule],
  selector: 'app-admin-roles',
  styleUrl: './admin-roles.css',
  templateUrl: './admin-roles.html',
})
export class AdminRoles implements OnInit {
  roles = signal<RolPanel[]>([]);
  usuarios = signal<Usuario[]>([]);
  secciones = SECCIONES;

  editandoId = signal<number | null>(null);
  nombre = signal('');
  elegidas = signal<Seccion[]>([]);

  mensajeOk = signal('');
  mensajeError = signal('');

  constructor(private rolesService: Roles, private usuariosService: Usuarios, private actividades: Actividades) {}

  ngOnInit() {
    this.cargar();
  }

  private async cargar() {
    const { data } = await this.rolesService.traerTodos();
    this.roles.set(data ?? []);
    const usuarios = await this.usuariosService.traerTodos();
    this.usuarios.set(usuarios.data ?? []);
  }

  cantidadUsuarios(rol: RolPanel) {
    return this.usuarios().filter(u => u.rol_id === rol.id).length;
  }

  textoSeccion(seccion: Seccion) {
    return SECCIONES.find(s => s.valor === seccion)?.texto ?? seccion;
  }

  alternar(seccion: Seccion) {
    this.elegidas.update(lista => lista.includes(seccion) ? lista.filter(s => s !== seccion) : [...lista, seccion]);
  }

  editar(rol: RolPanel) {
    this.editandoId.set(rol.id);
    this.nombre.set(rol.nombre);
    this.elegidas.set([...rol.secciones]);
    this.mensajeOk.set('');
    this.mensajeError.set('');
  }

  limpiar() {
    this.editandoId.set(null);
    this.nombre.set('');
    this.elegidas.set([]);
  }

  async guardar() {
    this.mensajeOk.set('');
    this.mensajeError.set('');
    const nombre = this.nombre().trim();
    if (!nombre || this.elegidas().length === 0) {
      this.mensajeError.set('Poné un nombre y elegí al menos una sección.');
      return;
    }
    const secciones = SECCIONES.map(s => s.valor).filter(s => this.elegidas().includes(s));
    const id = this.editandoId();
    const { error } = id === null
      ? await this.rolesService.crear(nombre, secciones)
      : await this.rolesService.modificar(id, nombre, secciones);
    if (error) {
      this.mensajeError.set(error.code === '23505' ? 'Ya hay un rol con ese nombre.' : 'No se pudo guardar el rol.');
      return;
    }
    const texto = secciones.map(s => this.textoSeccion(s)).join(', ');
    await this.actividades.registrar(`${id === null ? 'Creó' : 'Modificó'} el rol "${nombre}" (${texto})`);
    this.mensajeOk.set(id === null ? `Rol "${nombre}" creado. Asignalo en la pestaña Usuarios.` : `Rol "${nombre}" modificado.`);
    this.limpiar();
    await this.cargar();
  }

  async borrar(rol: RolPanel) {
    const cantidad = this.cantidadUsuarios(rol);
    const aviso = cantidad ? ` ${cantidad} usuario(s) lo tienen y se van a quedar sin acceso al panel.` : '';
    if (!confirm(`¿Borrar el rol "${rol.nombre}"?${aviso}`)) {
      return;
    }
    const { error } = await this.rolesService.borrar(rol.id);
    if (error) {
      this.mensajeError.set('No se pudo borrar el rol.');
      return;
    }
    await this.actividades.registrar(`Borró el rol "${rol.nombre}"`);
    if (this.editandoId() === rol.id) {
      this.limpiar();
    }
    await this.cargar();
  }
}
