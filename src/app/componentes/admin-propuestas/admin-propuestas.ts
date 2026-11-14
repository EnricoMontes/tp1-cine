import { Component, computed, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Propuestas } from '../../servicios/propuestas';
import { Propuesta } from '../../modelos/propuesta';

@Component({
  imports: [DatePipe, FormsModule],
  selector: 'app-admin-propuestas',
  styleUrl: './admin-propuestas.css',
  templateUrl: './admin-propuestas.html',
})
export class AdminPropuestas implements OnInit {
  propuestas = signal<Propuesta[]>([]);
  cargando = signal(true);
  mensajeError = signal('');
  mensajeOk = signal('');

  filtro = signal<'pendiente' | 'resueltas'>('pendiente');
  pendientes = computed(() => this.propuestas().filter(p => p.estado === 'pendiente'));
  resueltas = computed(() => this.propuestas().filter(p => p.estado !== 'pendiente'));
  filtradas = computed(() => this.filtro() === 'pendiente' ? this.pendientes() : this.resueltas());

  rechazandoId = signal<number | null>(null);
  respuesta = signal('');

  constructor(private propuestasService: Propuestas, private router: Router) {}

  ngOnInit() {
    this.cargar();
  }

  private async cargar() {
    const { data, error } = await this.propuestasService.traerTodas();
    if (error) {
      this.mensajeError.set('No se pudieron cargar las propuestas.');
    } else {
      this.propuestas.set(data ?? []);
    }
    this.cargando.set(false);
  }

  aceptar(propuesta: Propuesta) {
    this.router.navigate(['/admin/peliculas'], { queryParams: { propuesta: propuesta.id } });
  }

  abrirRechazo(propuesta: Propuesta) {
    this.rechazandoId.set(propuesta.id);
    this.respuesta.set('');
  }

  async confirmarRechazo(propuesta: Propuesta) {
    this.mensajeError.set('');
    this.mensajeOk.set('');
    const { error } = await this.propuestasService.rechazar(propuesta.id, this.respuesta().trim());
    if (error) {
      this.mensajeError.set(error.code === 'P0001' ? error.message : 'No se pudo rechazar la propuesta.');
      return;
    }
    this.mensajeOk.set(`Rechazaste "${propuesta.titulo}". Al cliente le llegó una notificación.`);
    this.rechazandoId.set(null);
    await this.cargar();
  }
}
