import { Component, computed, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Peliculas } from '../../servicios/peliculas';
import { Pelicula } from '../../modelos/pelicula';
import { CardPelicula } from '../card-pelicula/card-pelicula';
import { FiltroPeliculasPipe } from '../../pipes/filtro-peliculas-pipe';
import { Auth } from '../../servicios/auth';
import { Alerta, Alertas } from '../../servicios/alertas';
import { ventaAbierta } from '../../servicios/carrito';

@Component({
  imports: [CardPelicula, FormsModule, FiltroPeliculasPipe],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  peliculas = signal<Pelicula[]>([]);
  proximas = signal<Pelicula[]>([]);
  cargando = signal(true);
  mensajeError = signal('');

  avisos = signal<Alerta[]>([]);

  busqueda = signal('');

  masVendidas = computed(() =>
    this.peliculas()
      .filter(p => p.entradas_vendidas > 0)
      .sort((a, b) => b.entradas_vendidas - a.entradas_vendidas)
      .slice(0, 3)
  );

  constructor(
    private peliculasService: Peliculas,
    private router: Router,
    private auth: Auth,
    private alertasService: Alertas,
  ) {}

  ngOnInit() {
    this.cargarCartelera();
    this.cargarProximamente();
    this.cargarAvisos();
  }

  private async cargarAvisos() {
    await this.auth.sesionCargada;
    const usuario = this.auth.usuario();
    if (!usuario) {
      return;
    }
    const { data } = await this.alertasService.traerMias(usuario.id);
    this.avisos.set((data ?? []).filter(a => !a.notificada && a.peliculas && ventaAbierta(a.peliculas)));
  }

  async cerrarAviso(alerta: Alerta) {
    await this.alertasService.marcarNotificada(alerta.id);
    this.avisos.update(lista => lista.filter(a => a.id !== alerta.id));
  }

  private async cargarCartelera() {
    const { data, error } = await this.peliculasService.traerCartelera();
    if (error) {
      this.mensajeError.set('No se pudo cargar la cartelera. Probá de nuevo más tarde.');
    } else {
      this.peliculas.set(data ?? []);
    }
    this.cargando.set(false);
  }

  private async cargarProximamente() {
    const { data } = await this.peliculasService.traerProximamente();
    this.proximas.set(data ?? []);
  }

  verDetalle(pelicula: Pelicula) {
    this.router.navigate(['/peliculas', pelicula.id]);
  }
}
