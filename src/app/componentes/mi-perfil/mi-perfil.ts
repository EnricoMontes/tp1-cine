import { Component, computed, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Auth } from '../../servicios/auth';
import { Compras } from '../../servicios/compras';
import { Compra } from '../../modelos/compra';
import { EntradaPdf } from '../../servicios/entrada-pdf';
import { Resenias } from '../../servicios/resenias';
import { Resenia } from '../../modelos/resenia';
import { Canje } from '../../modelos/producto';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Notificaciones } from '../../servicios/notificaciones';
import { ListaEspera, MiEspera } from '../../servicios/lista-espera';

@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink],
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

  peliculasVistas = computed(() => this.compras().filter(c => c.validada_en));
  misResenias = signal<Resenia[]>([]);
  canjes = signal<Canje[]>([]);
  numeros = [1, 2, 3, 4, 5];

  constructor(
    protected auth: Auth,
    private comprasService: Compras,
    private entradaPdf: EntradaPdf,
    private reseniasService: Resenias,
    protected notificaciones: Notificaciones,
    private route: ActivatedRoute,
    private listaEspera: ListaEspera,
  ) {}

  esperas = signal<MiEspera[]>([]);

  private async cargarEsperas() {
    const { data } = await this.listaEspera.mias();
    this.esperas.set(data ?? []);
  }

  async salirDeLaLista(espera: MiEspera) {
    if (!confirm(`¿Salir de la lista de espera de ${espera.pelicula}?`)) {
      return;
    }
    await this.listaEspera.salir(espera.id);
    await this.cargarEsperas();
  }

  nuevas = signal<number[]>([]);

  ngOnInit() {
    this.cargar();
    this.cargarEsperas();
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'notificaciones') {
        this.verNotificaciones();
      }
    });
  }

  private verNotificaciones() {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return;
    }
    this.nuevas.set(this.notificaciones.lista().filter(n => !n.leida).map(n => n.id));
    this.notificaciones.marcarLeidas(usuario.id);
    setTimeout(() => document.getElementById('notificaciones')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  canceladaPorCine(compra: Compra) {
    return compra.estado === 'cancelada' && !!compra.compra_entradas[0]?.funciones?.cancelada_en;
  }

  private async cargar() {
    await this.auth.recargarPerfil();
    const usuario = this.auth.usuario();
    if (usuario) {
      const { data } = await this.comprasService.traerMisCompras(usuario.id);
      this.compras.set((data ?? []).filter(c => c.compra_entradas.length > 0));
      const resenias = await this.reseniasService.traerDeUsuario(usuario.id);
      this.misResenias.set(resenias.data ?? []);
      const canjes = await this.comprasService.traerMisCanjes(usuario.id);
      this.canjes.set(canjes.data ?? []);
    }
    this.cargandoCompras.set(false);
  }

  mensajeCancelar = signal('');

  puedeCancelar(compra: Compra) {
    const inicio = new Date(compra.compra_entradas[0].funciones.inicio);
    const limite = new Date(inicio.getTime() - 2 * 60 * 60 * 1000);
    return compra.estado === 'pagada' && !compra.validada_en && !compra.candy_entregado_en && new Date() < limite;
  }

  async cancelar(compra: Compra) {
    if (!confirm('¿Cancelar esta compra? No se devuelve dinero: el total pasa a tu crédito para futuras compras.')) {
      return;
    }
    this.mensajeCancelar.set('');
    const { data, error } = await this.comprasService.cancelar(compra.id);
    if (error) {
      this.mensajeCancelar.set(error.code === 'P0001' ? error.message : 'No se pudo cancelar la compra.');
      return;
    }
    this.mensajeCancelar.set(`Compra cancelada: se acreditaron $${Number(data).toLocaleString('es-AR')} a tu crédito.`);
    await this.cargar();
  }

  calificacion(peliculaId: number) {
    return this.misResenias().find(r => r.pelicula_id === peliculaId)?.estrellas ?? 0;
  }

  descargarPdf(compra: Compra) {
    const funcion = compra.compra_entradas[0].funciones;
    this.entradaPdf.descargar({
      codigo: compra.id,
      pelicula: funcion.peliculas?.nombre ?? '',
      inicio: funcion.inicio,
      sala: funcion.salas?.nombre ?? '',
      formato: funcion.formato,
      idioma: funcion.idioma,
      butacas: compra.compra_entradas.map(e => e.butacas.fila + e.butacas.numero).join(', '),
      total: compra.total,
      restriccion: funcion.peliculas?.restriccion_edad ?? null,
      candy: this.textoCandy(compra),
    });
  }

  textoCandy(compra: Compra) {
    const partes: string[] = [];
    for (const item of compra.compra_combos ?? []) {
      partes.push(`${item.cantidad} x ${item.combos.nombre}`);
    }
    for (const item of compra.compra_productos ?? []) {
      partes.push(`${item.cantidad} x ${item.productos.nombre}`);
    }
    return partes.join(', ');
  }
}
