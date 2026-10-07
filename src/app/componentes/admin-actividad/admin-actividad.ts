import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Actividades } from '../../servicios/actividades';
import { Actividad } from '../../modelos/actividad';

@Component({
  imports: [FormsModule, DatePipe],
  selector: 'app-admin-actividad',
  styleUrl: './admin-actividad.css',
  templateUrl: './admin-actividad.html',
})
export class AdminActividad implements OnInit {
  actividades = signal<Actividad[]>([]);
  cargando = signal(true);

  busqueda = signal('');
  porPagina = 15;
  pagina = signal(0);
  filtradas = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.actividades().filter(a =>
      a.usuario.toLowerCase().includes(texto) || a.accion.toLowerCase().includes(texto)
    );
  });
  totalPaginas = computed(() => Math.ceil(this.filtradas().length / this.porPagina));
  deLaPagina = computed(() => {
    const desde = this.pagina() * this.porPagina;
    return this.filtradas().slice(desde, desde + this.porPagina);
  });

  constructor(private actividadesService: Actividades) {}

  async ngOnInit() {
    const { data } = await this.actividadesService.traerTodas();
    this.actividades.set(data ?? []);
    this.cargando.set(false);
  }
}
