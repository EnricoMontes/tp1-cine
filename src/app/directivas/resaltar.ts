import { Directive, ElementRef, HostListener, inject, input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appResaltar]',
})
export class Resaltar {
  appResaltar = input(1.03);

  private elemento = inject(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('mouseenter') alEntrar() {
    const el = this.elemento.nativeElement;
    this.renderer.setStyle(el, 'transform', `scale(${this.appResaltar()})`);
    this.renderer.setStyle(el, 'border-color', 'var(--acento)');
    this.renderer.setStyle(el, 'box-shadow', '0 8px 24px rgba(0, 0, 0, 0.5)');
  }

  @HostListener('mouseleave') alSalir() {
    const el = this.elemento.nativeElement;
    this.renderer.removeStyle(el, 'transform');
    this.renderer.removeStyle(el, 'border-color');
    this.renderer.removeStyle(el, 'box-shadow');
  }
}
