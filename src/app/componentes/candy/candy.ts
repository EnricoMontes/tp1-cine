import { Component, computed, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Candy } from '../../servicios/candy';
import { Carrito } from '../../servicios/carrito';
import { Categoria, Combo, Producto } from '../../modelos/producto';

@Component({
  imports: [CurrencyPipe, FormsModule],
  selector: 'app-candy',
  styleUrl: './candy.css',
  templateUrl: './candy.html',
})
export class CandyBar implements OnInit {
  productos = signal<Producto[]>([]);
  combos = signal<Combo[]>([]);
  cargando = signal(true);
  busqueda = signal('');

  categorias: Categoria[] = ['Pochoclos', 'Bebidas', 'Golosinas'];

  combosFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.combos().filter(c => `${c.nombre} ${c.incluye}`.toLowerCase().includes(texto));
  });
  productosFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.productos().filter(p => p.nombre.toLowerCase().includes(texto));
  });

  constructor(private candyService: Candy, private carrito: Carrito, private router: Router) {}

  async ngOnInit() {
    const [productos, combos] = await Promise.all([
      this.candyService.traerProductos(true),
      this.candyService.traerCombos(true),
    ]);
    this.productos.set(productos.data ?? []);
    this.combos.set(combos.data ?? []);
    this.cargando.set(false);
  }

  productosDe(categoria: Categoria) {
    return this.productosFiltrados().filter(p => p.categoria === categoria);
  }

  irA(seccion: string) {
    document.getElementById(seccion)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  quiero(tipo: 'producto' | 'combo', item: Producto | Combo) {
    this.carrito.candyElegido.set({ tipo, id: item.id, nombre: item.nombre });
    this.router.navigate(['/cartelera']);
  }
}
