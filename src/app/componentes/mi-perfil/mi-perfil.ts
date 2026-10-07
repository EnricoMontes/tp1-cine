import { Component, computed, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Auth } from '../../servicios/auth';
import { Compras } from '../../servicios/compras';
import { Compra } from '../../modelos/compra';

@Component({
  imports: [CurrencyPipe, DatePipe],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil implements OnInit {
  compras = signal<Compra[]>([]);
  cargandoCompras = signal(true);

  porPagina = 5;
  pagina = signal(0);
  totalPaginas = computed(() => Math.ceil(this.compras().length / this.porPagina));
  comprasDeLaPagina = computed(() => {
    const desde = this.pagina() * this.porPagina;
    return this.compras().slice(desde, desde + this.porPagina);
  });

  constructor(protected auth: Auth, private comprasService: Compras) {}

  async ngOnInit() {
    await this.auth.recargarPerfil();
    const usuario = this.auth.usuario();
    if (usuario) {
      const { data } = await this.comprasService.traerMisCompras(usuario.id);
      this.compras.set(data ?? []);
    }
    this.cargandoCompras.set(false);
  }
}
