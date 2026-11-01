import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Candy } from '../../servicios/candy';
import { Actividades } from '../../servicios/actividades';
import { Categoria, Combo, Producto } from '../../modelos/producto';

type TipoCandy = 'producto' | 'combo';

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

  tipo = signal<TipoCandy>('producto');
  editandoId = signal<number | null>(null);
  formCandy = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    categoria: new FormControl<Categoria>('Pochoclos', { nonNullable: true }),
    incluye: new FormControl({ value: '', disabled: true }, { nonNullable: true, validators: [Validators.required] }),
    precio: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    puntos: new FormControl<number | null>(null, { validators: [Validators.min(1)] }),
    imagenUrl: new FormControl('', { nonNullable: true }),
  });
  archivoFoto = signal<File | null>(null);
  vistaFoto = signal('');

  puntosEntrada = new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] });
  puntosEntradaGuardados = signal<number | null>(null);
  mensajeCanje = signal('');

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

  cambiarTipo(tipo: TipoCandy) {
    this.tipo.set(tipo);
    if (tipo === 'producto') {
      this.formCandy.controls.categoria.enable();
      this.formCandy.controls.incluye.disable();
    } else {
      this.formCandy.controls.categoria.disable();
      this.formCandy.controls.incluye.enable();
    }
  }

  elegirFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = '';
    if (!archivo) {
      return;
    }
    if (!archivo.type.startsWith('image/')) {
      this.mensajeError.set('La foto tiene que ser una imagen (jpg, png, webp...).');
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      this.mensajeError.set('La foto no puede pesar más de 2 MB.');
      return;
    }
    this.mensajeError.set('');
    this.archivoFoto.set(archivo);
    this.vistaFoto.set(URL.createObjectURL(archivo));
  }

  editarProducto(producto: Producto) {
    this.cambiarTipo('producto');
    this.editandoId.set(producto.id);
    this.formCandy.reset({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      puntos: producto.puntos ?? null,
      imagenUrl: producto.imagen_url ?? '',
    });
    this.prepararEdicion();
  }

  editarCombo(combo: Combo) {
    this.cambiarTipo('combo');
    this.editandoId.set(combo.id);
    this.formCandy.reset({
      nombre: combo.nombre,
      incluye: combo.incluye,
      precio: combo.precio,
      puntos: combo.puntos ?? null,
      imagenUrl: combo.imagen_url ?? '',
    });
    this.prepararEdicion();
  }

  private prepararEdicion() {
    this.archivoFoto.set(null);
    this.vistaFoto.set('');
    this.limpiarMensajes();
    document.getElementById('formulario-candy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('nombreCandy')?.focus({ preventScroll: true });
  }

  cancelar() {
    this.editandoId.set(null);
    this.formCandy.reset({ categoria: 'Pochoclos' });
    this.archivoFoto.set(null);
    this.vistaFoto.set('');
  }

  private async urlFoto(actual: string) {
    const archivo = this.archivoFoto();
    if (!archivo) {
      return actual || null;
    }
    const subida = await this.candyService.subirFoto(archivo, this.tipo() === 'producto' ? 'productos' : 'combos');
    if (subida.error) {
      this.mensajeError.set('No se pudo subir la foto.');
      return undefined;
    }
    return subida.url;
  }

  async guardar() {
    this.limpiarMensajes();
    const valores = this.formCandy.getRawValue();
    const imagenUrl = await this.urlFoto(valores.imagenUrl);
    if (imagenUrl === undefined) {
      return;
    }
    const comunes = { nombre: valores.nombre.trim(), precio: valores.precio!, puntos: valores.puntos || null, imagen_url: imagenUrl };

    const ok = this.tipo() === 'producto'
      ? await this.guardarProducto({ ...comunes, categoria: valores.categoria })
      : await this.guardarCombo({ ...comunes, incluye: valores.incluye.trim() });
    if (!ok) {
      return;
    }
    this.mensajeOk.set(this.tipo() === 'producto' ? 'Producto guardado.' : 'Combo guardado.');
    this.cancelar();
    this.cargar();
  }

  private async guardarProducto(datos: Omit<Producto, 'id' | 'vendidos' | 'activo'>) {
    const id = this.editandoId();
    if (id === null) {
      const { error } = await this.candyService.crearProducto({ ...datos, activo: true });
      if (error) {
        this.mensajeError.set('No se pudo crear el producto.');
        return false;
      }
      await this.actividades.registrar(`Creó el producto ${datos.nombre} (${datos.categoria}, $${datos.precio})`);
      return true;
    }
    const antes = this.productos().find(p => p.id === id);
    const { error } = await this.candyService.modificarProducto(id, datos);
    if (error) {
      this.mensajeError.set('No se pudo modificar el producto.');
      return false;
    }
    if (antes && antes.precio !== datos.precio) {
      await this.actividades.registrar(`Cambió el precio de ${datos.nombre} de $${antes.precio} a $${datos.precio}`);
    } else {
      await this.actividades.registrar(`Modificó el producto ${datos.nombre}`);
    }
    return true;
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

  private async guardarCombo(datos: Omit<Combo, 'id' | 'vendidos' | 'activo'>) {
    const id = this.editandoId();
    if (id === null) {
      const { error } = await this.candyService.crearCombo({ ...datos, activo: true });
      if (error) {
        this.mensajeError.set('No se pudo crear el combo.');
        return false;
      }
      await this.actividades.registrar(`Creó el combo ${datos.nombre} ($${datos.precio})`);
      return true;
    }
    const antes = this.combos().find(c => c.id === id);
    const { error } = await this.candyService.modificarCombo(id, datos);
    if (error) {
      this.mensajeError.set('No se pudo modificar el combo.');
      return false;
    }
    if (antes && antes.precio !== datos.precio) {
      await this.actividades.registrar(`Cambió el precio del ${datos.nombre} de $${antes.precio} a $${datos.precio}`);
    } else {
      await this.actividades.registrar(`Modificó el combo ${datos.nombre}`);
    }
    return true;
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
