import { Component, OnInit, signal } from '@angular/core';
import { Salas } from '../../servicios/salas';
import { Butaca, Formato, Sala } from '../../modelos/sala';
import { MapaButacas } from '../mapa-butacas/mapa-butacas';

@Component({
  imports: [MapaButacas],
  selector: 'app-admin-salas',
  styleUrl: './admin-salas.css',
  templateUrl: './admin-salas.html',
})
export class AdminSalas implements OnInit {
  salas = signal<Sala[]>([]);
  salaSeleccionada = signal<Sala | null>(null);
  butacas = signal<Butaca[]>([]);

  formatos: Formato[] = ['2D', '3D', '4D', '5D'];

  mensajeError = signal('');
  mensajeOk = signal('');

  constructor(private salasService: Salas) {}

  ngOnInit() {
    this.cargarSalas();
  }

  private async cargarSalas() {
    const { data, error } = await this.salasService.traerSalas();
    if (error) {
      this.mensajeError.set('No se pudieron cargar las salas.');
      return;
    }
    this.salas.set(data ?? []);
  }

  async cambiarFormato(sala: Sala, event: Event) {
    const formato = (event.target as HTMLSelectElement).value as Formato;
    this.mensajeError.set('');
    this.mensajeOk.set('');

    const { error } = await this.salasService.cambiarFormato(sala.id, formato);
    if (error) {
      this.mensajeError.set('No se pudo cambiar el formato.');
      return;
    }
    this.mensajeOk.set(`${sala.nombre} ahora es ${formato}.`);
    await this.cargarSalas();
  }

  async verButacas(sala: Sala) {
    this.salaSeleccionada.set(sala);
    const { data, error } = await this.salasService.traerButacas(sala.id);
    if (error) {
      this.mensajeError.set('No se pudieron cargar las butacas.');
      return;
    }
    this.butacas.set(data ?? []);
  }

  contar(tipo: Butaca['tipo']) {
    return this.butacas().filter(b => b.tipo === tipo).length;
  }
}
