import { Component, computed, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';
import { Propuestas } from '../../servicios/propuestas';
import { Propuesta } from '../../modelos/propuesta';

@Component({
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  selector: 'app-proponer',
  styleUrl: './proponer.css',
  templateUrl: './proponer.html',
})
export class Proponer implements OnInit {
  propuestas = signal<Propuesta[]>([]);
  cargando = signal(true);
  enviando = signal(false);
  mensajeError = signal('');
  mensajeOk = signal('');

  pendiente = computed(() => this.propuestas().find(p => p.estado === 'pendiente') ?? null);

  formPropuesta = new FormGroup({
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)] }),
    motivo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)] }),
  });

  constructor(private auth: Auth, private propuestasService: Propuestas) {}

  ngOnInit() {
    this.cargar();
  }

  private async cargar() {
    await this.auth.sesionCargada;
    const usuario = this.auth.usuario();
    if (usuario) {
      const { data } = await this.propuestasService.traerMias(usuario.id);
      this.propuestas.set(data ?? []);
    }
    this.cargando.set(false);
  }

  async enviar() {
    this.mensajeError.set('');
    this.mensajeOk.set('');
    const { titulo, descripcion, motivo } = this.formPropuesta.getRawValue();
    this.enviando.set(true);
    const { error } = await this.propuestasService.proponer(titulo.trim(), descripcion.trim(), motivo.trim());
    this.enviando.set(false);
    if (error) {
      if (error.code === 'P0001') {
        this.mensajeError.set(error.message);
      } else if (error.code === '23505') {
        this.mensajeError.set('Ya tenés una propuesta pendiente.');
      } else {
        this.mensajeError.set('No se pudo enviar la propuesta. Probá de nuevo.');
      }
      return;
    }
    this.mensajeOk.set('¡Gracias! Recibimos tu propuesta. Te avisamos por la campanita cuando la revisemos.');
    this.formPropuesta.reset();
    await this.cargar();
  }

  textoEstado(estado: Propuesta['estado']) {
    return estado === 'pendiente' ? 'En revisión' : estado === 'aceptada' ? 'Aceptada' : 'Rechazada';
  }
}
