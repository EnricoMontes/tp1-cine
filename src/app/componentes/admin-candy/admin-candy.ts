import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Candy } from '../../servicios/candy';
import { Actividades } from '../../servicios/actividades';
import { Categoria, Combo, Producto } from '../../modelos/producto';

@Component({
  imports: [ReactiveFormsModule, CurrencyPipe],
  selector: 'app-admin-candy',
  styleUrl: './admin-candy.css',
  templateUrl: './admin-candy.html',
})
export class AdminCandy implements OnInit {
  productos = signal<Producto[]>([]);
  combos = signal<Combo[]>([]);
  categorias: Categoria[] = ['Pochoclos', 'Bebidas', 'Golosinas'];

  mensajeError = signal('');
  mensajeOk = signal('');

  editandoProductoId = signal<number | null>(null);
  formProducto = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    categoria: new FormControl<Categoria>('Pochoclos', { nonNullable: true }),
    precio: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    puntos: new FormControl<number | null>(null, { validators: [Validators.min(1)] }),
  });

  puntosEntrada = new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] });
  puntosEntradaGuardados = signal<number | null>(null);
  mensajeCanje = signal('');

  editandoComboId = signal<number | null>(null);
  formCombo = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    incluye: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    precio: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
  });

  constructor(private candyService: Candy, private actividades: Actividades) {}

  ngOnInit() {
    this.cargar();
  }

  private async cargar() {
    const productos = await this.candyService.traerProductos(false);
    const combos = await this.candyService.traerCombos(false);
    this.productos.set(productos.data ?? []);
    this.combos.set(combos.data ?? []);
    const config = await this.candyService.traerPuntosEntrada();
    this.puntosEntradaGuardados.set(config.data?.[0]?.puntos_entrada ?? null);
    this.puntosEntrada.setValue(this.puntosEntradaGuardados());
  }

  async guardarPuntosEntrada() {
    const nuevo = this.puntosEntrada.value!;
    if (nuevo === this.puntosEntradaGuardados()) {
      this.mensajeCanje.set('No hubo cambios.');
      return;
    }
    const { error } = await this.candyService.guardarPuntosEntrada(nuevo);
    if (error) {
      this.mensajeCanje.set('No se pudo guardar.');
      return;
    }
    await this.actividades.registrar(`Cambió los puntos de la entrada gratis de ${this.puntosEntradaGuardados()} a ${nuevo}`);
    this.mensajeCanje.set(`✓ Guardado: la entrada gratis cuesta ${nuevo} puntos.`);
    this.cargar();
  }

  private limpiarMensajes() {
    this.mensajeError.set('');
    this.mensajeOk.set('');
  }

  editarProducto(producto: Producto) {
    this.editandoProductoId.set(producto.id);
    this.formProducto.setValue({ nombre: producto.nombre, categoria: producto.categoria, precio: producto.precio, puntos: producto.puntos ?? null });
  }

  cancelarProducto() {
    this.editandoProductoId.set(null);
    this.formProducto.reset({ categoria: 'Pochoclos' });
  }

  async guardarProducto() {
    this.limpiarMensajes();
    const valores = this.formProducto.getRawValue();
    const datos = { nombre: valores.nombre.trim(), categoria: valores.categoria, precio: valores.precio!, puntos: valores.puntos || null };
    const id = this.editandoProductoId();

    if (id === null) {
      const { error } = await this.candyService.crearProducto({ ...datos, activo: true });
      if (error) {
        this.mensajeError.set('No se pudo crear el producto.');
        return;
      }
      await this.actividades.registrar(`Creó el producto ${datos.nombre} (${datos.categoria}, $${datos.precio})`);
    } else {
      const antes = this.productos().find(p => p.id === id);
      const { error } = await this.candyService.modificarProducto(id, datos);
      if (error) {
        this.mensajeError.set('No se pudo modificar el producto.');
        return;
      }
      if (antes && antes.precio !== datos.precio) {
        await this.actividades.registrar(`Cambió el precio de ${datos.nombre} de $${antes.precio} a $${datos.precio}`);
      } else {
        await this.actividades.registrar(`Modificó el producto ${datos.nombre}`);
      }
    }
    this.mensajeOk.set('Producto guardado.');
    this.cancelarProducto();
    this.cargar();
  }

  async cambiarActivoProducto(producto: Producto) {
    this.limpiarMensajes();
    const { error } = await this.candyService.modificarProducto(producto.id, { activo: !producto.activo });
    if (error) {
      this.mensajeError.set('No se pudo guardar el cambio.');
      return;
    }
    await this.actividades.registrar(`${producto.activo ? 'Desactivó' : 'Activó'} el producto ${producto.nombre}`);
    this.cargar();
  }

  async borrarProducto(producto: Producto) {
    if (!confirm(`¿Borrar ${producto.nombre}?`)) {
      return;
    }
    this.limpiarMensajes();
    const { error } = await this.candyService.borrarProducto(producto.id);
    if (error) {
      this.mensajeError.set('No se pudo borrar (si ya se vendió, desactivalo en lugar de borrarlo).');
      return;
    }
    await this.actividades.registrar(`Borró el producto ${producto.nombre}`);
    this.cargar();
  }

  editarCombo(combo: Combo) {
    this.editandoComboId.set(combo.id);
    this.formCombo.setValue({ nombre: combo.nombre, incluye: combo.incluye, precio: combo.precio });
  }

  cancelarCombo() {
    this.editandoComboId.set(null);
    this.formCombo.reset();
  }

  async guardarCombo() {
    this.limpiarMensajes();
    const valores = this.formCombo.getRawValue();
    const datos = { nombre: valores.nombre.trim(), incluye: valores.incluye.trim(), precio: valores.precio! };
    const id = this.editandoComboId();

    if (id === null) {
      const { error } = await this.candyService.crearCombo({ ...datos, activo: true });
      if (error) {
        this.mensajeError.set('No se pudo crear el combo.');
        return;
      }
      await this.actividades.registrar(`Creó el combo ${datos.nombre} ($${datos.precio})`);
    } else {
      const antes = this.combos().find(c => c.id === id);
      const { error } = await this.candyService.modificarCombo(id, datos);
      if (error) {
        this.mensajeError.set('No se pudo modificar el combo.');
        return;
      }
      if (antes && antes.precio !== datos.precio) {
        await this.actividades.registrar(`Cambió el precio del ${datos.nombre} de $${antes.precio} a $${datos.precio}`);
      } else {
        await this.actividades.registrar(`Modificó el combo ${datos.nombre}`);
      }
    }
    this.mensajeOk.set('Combo guardado.');
    this.cancelarCombo();
    this.cargar();
  }

  async cambiarActivoCombo(combo: Combo) {
    this.limpiarMensajes();
    const { error } = await this.candyService.modificarCombo(combo.id, { activo: !combo.activo });
    if (error) {
      this.mensajeError.set('No se pudo guardar el cambio.');
      return;
    }
    await this.actividades.registrar(`${combo.activo ? 'Desactivó' : 'Activó'} el combo ${combo.nombre}`);
    this.cargar();
  }

  async borrarCombo(combo: Combo) {
    if (!confirm(`¿Borrar ${combo.nombre}?`)) {
      return;
    }
    this.limpiarMensajes();
    const { error } = await this.candyService.borrarCombo(combo.id);
    if (error) {
      this.mensajeError.set('No se pudo borrar (si ya se vendió, desactivalo en lugar de borrarlo).');
      return;
    }
    await this.actividades.registrar(`Borró el combo ${combo.nombre}`);
    this.cargar();
  }
}
