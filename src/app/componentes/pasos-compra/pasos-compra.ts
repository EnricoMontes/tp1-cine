import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-pasos-compra',
  styleUrl: './pasos-compra.css',
  templateUrl: './pasos-compra.html',
})
export class PasosCompra {
  actual = input.required<number>();

  pasos = ['Entradas', 'Butacas', 'Pago'];
}
