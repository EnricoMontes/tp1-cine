import { Component, computed, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cupones } from '../../servicios/cupones';
import { Cupon } from '../../modelos/cupon';
import { Actividades } from '../../servicios/actividades';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-admin-cupones',
  styleUrl: './admin-cupones.css',
  templateUrl: './admin-cupones.html',
})
export class AdminCupones implements OnInit {
  cupones = signal<Cupon[]>([]);
  mensajeError = signal('');
  mensajeOk = signal('');

  bienvenida = computed(() => this.cupones().find(c => c.tipo === 'bienvenida') ?? null);
  mayores50 = computed(() => this.cupones().find(c => c.tipo === 'mayores_50') ?? null);
  conCodigo = computed(() => this.cupones().filter(c => c.tipo === 'codigo'));

  porcentajeBienvenida = new FormControl(20, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1), Validators.max(100)],
  });
  porcentajeMayores50 = new FormControl(30, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1), Validators.max(100)],
  });

  formCupon = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Z0-9]{4,20}$/)],
    }),
    porcentaje: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(100)],
    }),
  });

  constructor(private cuponesService: Cupones, private actividades: Actividades) {}

  ngOnInit() {
    this.cargar();
  }

  private async cargar() {
    const { data, error } = await this.cuponesService.traerTodos();
    if (error) {
      this.mensajeError.set('No se pudieron cargar los cupones.');
      return;
    }
    this.cupones.set(data ?? []);
    this.porcentajeBienvenida.setValue(this.bienvenida()?.porcentaje ?? 20);
    this.porcentajeMayores50.setValue(this.mayores50()?.porcentaje ?? 30);
  }

  async guardarBienvenida() {
    const cupon = this.bienvenida();
    if (!cupon || this.porcentajeBienvenida.invalid) {
      return;
    }
    await this.modificar(cupon, { porcentaje: this.porcentajeBienvenida.value });
  }

  async guardarMayores50() {
    if (this.porcentajeMayores50.invalid) {
      return;
    }
    const cupon = this.mayores50();
    if (cupon) {
      await this.modificar(cupon, { porcentaje: this.porcentajeMayores50.value });
      return;
    }
    const { error } = await this.cuponesService.crear('mayores_50', null, this.porcentajeMayores50.value);
    if (error) {
      this.mensajeError.set('No se pudo guardar el cupón.');
      return;
    }
    await this.actividades.registrar(`Creó el cupón de mayores de 50 (${this.porcentajeMayores50.value}%)`);
    this.mensajeOk.set('Cambio guardado.');
    this.cargar();
  }

  async crear() {
    this.mensajeError.set('');
    this.mensajeOk.set('');
    const { codigo, porcentaje } = this.formCupon.getRawValue();
    const { error } = await this.cuponesService.crear('codigo', codigo, porcentaje!);
    if (error) {
      this.mensajeError.set(error.code === '23505' ? 'Ya existe un cupón con ese código.' : 'No se pudo crear el cupón.');
      return;
    }
    await this.actividades.registrar(`Creó el cupón ${codigo} (${porcentaje}%)`);
    this.mensajeOk.set(`Cupón ${codigo} creado.`);
    this.formCupon.reset();
    this.cargar();
  }

  async cambiarActivo(cupon: Cupon) {
    await this.modificar(cupon, { activo: !cupon.activo });
  }

  async borrar(cupon: Cupon) {
    if (!confirm(`¿Borrar el cupón ${cupon.codigo}?`)) {
      return;
    }
    const { error } = await this.cuponesService.borrar(cupon.id);
    if (error) {
      this.mensajeError.set('No se pudo borrar el cupón.');
      return;
    }
    await this.actividades.registrar(`Borró el cupón ${this.nombreCupon(cupon)}`);
    this.cargar();
  }

  pasarAMayusculas() {
    const control = this.formCupon.controls.codigo;
    control.setValue(control.value.toUpperCase());
  }

  private async modificar(cupon: Cupon, cambios: { porcentaje?: number; activo?: boolean }) {
    this.mensajeError.set('');
    this.mensajeOk.set('');
    const { error } = await this.cuponesService.modificar(cupon.id, cambios);
    if (error) {
      this.mensajeError.set('No se pudo guardar el cambio.');
      return;
    }
    if (cambios.porcentaje !== undefined) {
      await this.actividades.registrar(`Cambió el cupón ${this.nombreCupon(cupon)} de ${cupon.porcentaje}% a ${cambios.porcentaje}%`);
    } else {
      await this.actividades.registrar(`${cambios.activo ? 'Activó' : 'Desactivó'} el cupón ${this.nombreCupon(cupon)}`);
    }
    this.mensajeOk.set('Cambio guardado.');
    this.cargar();
  }

  private nombreCupon(cupon: Cupon) {
    if (cupon.tipo === 'bienvenida') {
      return 'de bienvenida';
    }
    if (cupon.tipo === 'mayores_50') {
      return 'de mayores de 50';
    }
    return cupon.codigo ?? '';
  }
}
