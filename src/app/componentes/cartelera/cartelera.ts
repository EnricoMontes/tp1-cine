import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Peliculas } from '../../servicios/peliculas';
import { Genero, Pelicula } from '../../modelos/pelicula';
import { CardPelicula } from '../card-pelicula/card-pelicula';
import { FiltroPeliculasPipe } from '../../pipes/filtro-peliculas-pipe';
import { Carrito } from '../../servicios/carrito';

type Seccion = 'todas' | 'estrenos' | 'cartelera' | 'proximamente';
type Edad = 'todas' | 'atp' | '13' | '18';

@Component({
  imports: [CardPelicula, FormsModule, FiltroPeliculasPipe],
  selector: 'app-cartelera',
  styleUrl: './cartelera.css',
  templateUrl: './cartelera.html',
})
export class Cartelera implements OnInit {
  peliculas = signal<Pelicula[]>([]);
  proximas = signal<Pelicula[]>([]);
  cargando = signal(true);
  mensajeError = signal('');

  generos = signal<Genero[]>([]);

  seccion = signal<Seccion>('todas');
  busqueda = signal('');
  generosElegidos = signal<number[]>([]);
  edad = signal<Edad>('todas');

  panelAbierto = signal(false);
  borradorSeccion = signal<Seccion>('todas');
  borradorGeneros = signal<number[]>([]);
  borradorEdad = signal<Edad>('todas');

  chips: { texto: string; seccion: Seccion }[] = [
    { texto: 'Todas', seccion: 'todas' },
    { texto: 'En cartelera', seccion: 'cartelera' },
    { texto: 'Estrenos', seccion: 'estrenos' },
    { texto: 'Próximamente', seccion: 'proximamente' },
  ];

  opcionesEdad: { texto: string; valor: Edad }[] = [
    { texto: 'Todas', valor: 'todas' },
    { texto: 'ATP', valor: 'atp' },
    { texto: '+13', valor: '13' },
    { texto: '+18', valor: '18' },
  ];

  cantidadFiltros = computed(() => this.generosElegidos().length + (this.edad() !== 'todas' ? 1 : 0));

  generosActivos = computed(() => this.generos().filter(g => this.generosElegidos().includes(g.id)));

  lista = computed(() => {
    let lista: Pelicula[];
    switch (this.seccion()) {
      case 'estrenos':
        lista = this.peliculas().filter(p => p.es_estreno);
        break;
      case 'cartelera':
        lista = this.peliculas().filter(p => !p.es_estreno);
        break;
      case 'proximamente':
        lista = this.proximas();
        break;
      default:
        lista = [
          ...this.peliculas().filter(p => p.es_estreno),
          ...this.peliculas().filter(p => !p.es_estreno),
          ...this.proximas(),
        ];
    }

    const elegidos = this.generosElegidos();
    if (elegidos.length) {
      lista = lista.filter(p => (p.generos ?? []).some(g => elegidos.includes(g.id)));
    }

    const edad = this.edad();
    if (edad === 'atp') {
      lista = lista.filter(p => p.restriccion_edad === null);
    } else if (edad !== 'todas') {
      lista = lista.filter(p => p.restriccion_edad === Number(edad));
    }

    return lista;
  });

  constructor(
    private peliculasService: Peliculas,
    private router: Router,
    private route: ActivatedRoute,
    protected carrito: Carrito,
  ) {}

  ngOnInit() {
    const seccion = this.route.snapshot.queryParamMap.get('seccion');
    if (seccion === 'estrenos' || seccion === 'cartelera' || seccion === 'proximamente') {
      this.seccion.set(seccion);
    }
    this.cargar();
  }

  private async cargar() {
    const [cartelera, proximamente, generos] = await Promise.all([
      this.peliculasService.traerCartelera(),
      this.peliculasService.traerProximamente(),
      this.peliculasService.traerGeneros(),
    ]);
    if (cartelera.error) {
      this.mensajeError.set('No se pudo cargar la cartelera. Probá de nuevo más tarde.');
    } else {
      this.peliculas.set(cartelera.data ?? []);
      this.proximas.set(proximamente.data ?? []);
      this.generos.set(generos.data ?? []);
    }
    this.cargando.set(false);
  }

  abrirFiltros() {
    this.borradorSeccion.set(this.seccion());
    this.borradorGeneros.set(this.generosElegidos());
    this.borradorEdad.set(this.edad());
    this.panelAbierto.set(true);
  }

  cerrarFiltros() {
    this.panelAbierto.set(false);
  }

  alternarGenero(id: number) {
    this.borradorGeneros.update(lista => lista.includes(id) ? lista.filter(g => g !== id) : [...lista, id]);
  }

  aplicarFiltros() {
    this.seccion.set(this.borradorSeccion());
    this.generosElegidos.set(this.borradorGeneros());
    this.edad.set(this.borradorEdad());
    this.cerrarFiltros();
  }

  limpiarBorrador() {
    this.borradorSeccion.set('todas');
    this.borradorGeneros.set([]);
    this.borradorEdad.set('todas');
  }

  quitarGenero(id: number) {
    this.generosElegidos.update(lista => lista.filter(g => g !== id));
  }

  textoEdad() {
    return this.opcionesEdad.find(o => o.valor === this.edad())?.texto;
  }

  borrarFiltros() {
    this.generosElegidos.set([]);
    this.edad.set('todas');
  }

  verDetalle(pelicula: Pelicula) {
    this.router.navigate(['/peliculas', pelicula.id]);
  }
}
