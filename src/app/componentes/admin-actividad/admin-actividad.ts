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

  diasDeLaPagina = computed(() => {
    const dias: { fecha: string; actividades: Actividad[] }[] = [];
    for (const actividad of this.deLaPagina()) {
      const fecha = this.fechaLocal(actividad.creado_en);
      const ultimo = dias[dias.length - 1];
      if (ultimo && ultimo.fecha === fecha) {
        ultimo.actividades.push(actividad);
      } else {
        dias.push({ fecha, actividades: [actividad] });
      }
    }
    return dias;
  });

  constructor(private actividadesService: Actividades) {}

  private fechaLocal(fecha: string) {
    const d = new Date(fecha);
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
  }

  textoDia(fecha: string) {
    return new Date(fecha + 'T00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  }

  tipo(accion: string) {
    if (accion.startsWith('Validó')) {
      return 'validar';
    }
    if (accion.startsWith('Entregó')) {
      return 'candy';
    }
    if (accion.startsWith('Creó')) {
      return 'crear';
    }
    if (accion.startsWith('Borró')) {
      return 'borrar';
    }
    return 'cambiar';
  }

  nombreDe(usuario: string) {
    return usuario.replace(/\s*\([^)]*\)$/, '');
  }

  rolDe(usuario: string) {
    return usuario.match(/\(([^)]*)\)$/)?.[1] ?? '';
  }

  async ngOnInit() {
    const { data } = await this.actividadesService.traerTodas();
    this.actividades.set(data ?? []);
    this.cargando.set(false);
  }
}
