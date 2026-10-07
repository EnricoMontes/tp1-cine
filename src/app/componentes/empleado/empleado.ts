import { Component, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Compras } from '../../servicios/compras';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-empleado',
  styleUrl: './empleado.css',
  templateUrl: './empleado.html',
})
export class Empleado implements OnInit {
  codigo = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  cargando = signal(false);
  mensajeOk = signal('');
  mensajeError = signal('');

  constructor(private route: ActivatedRoute, private comprasService: Compras) {}

  ngOnInit() {
    const codigoUrl = this.route.snapshot.paramMap.get('codigo');
    if (codigoUrl) {
      this.codigo.setValue(codigoUrl);
    }
  }

  validar() {
    this.procesar('entrada');
  }

  entregarCandy() {
    this.procesar('candy');
  }

  private async procesar(que: 'entrada' | 'candy') {
    this.mensajeOk.set('');
    this.mensajeError.set('');
    this.cargando.set(true);
    const codigo = this.codigo.value.trim();
    const { data, error } = que === 'entrada'
      ? await this.comprasService.validar(codigo)
      : await this.comprasService.entregarCandy(codigo);
    this.cargando.set(false);

    if (error) {
      if (error.code === 'P0001') {
        this.mensajeError.set(error.message);
      } else if (error.code === '22P02') {
        this.mensajeError.set('El código no tiene un formato válido. Revisalo.');
      } else {
        this.mensajeError.set('No se pudo validar. Probá de nuevo.');
      }
      return;
    }
    this.mensajeOk.set(data);
    this.codigo.setValue('');
  }
}
