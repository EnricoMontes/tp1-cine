import { Component, computed, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Funciones } from '../../servicios/funciones';
import { Peliculas } from '../../servicios/peliculas';
import { Salas } from '../../servicios/salas';
import { Funcion } from '../../modelos/funcion';
import { Actividades } from '../../servicios/actividades';
import { Pelicula } from '../../modelos/pelicula';
import { Formato } from '../../modelos/sala';
import { aFechaBase, fechaValidator, horaValidator, ponerBarras, ponerDosPuntos } from '../../validadores/fecha.validadores';

@Component({
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  selector: 'app-admin-funciones',
  styleUrl: './admin-funciones.css',
  templateUrl: './admin-funciones.html',
})
export class AdminFunciones implements OnInit {
  funciones = signal<Funcion[]>([]);

  busqueda = signal('');
  porPagina = 10;
  pagina = signal(0);
  funcionesFiltradas = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.funciones().filter(f =>
      (f.peliculas?.nombre ?? '').toLowerCase().includes(texto) ||
      (f.salas?.nombre ?? '').toLowerCase().includes(texto)
    );
  });
  totalPaginas = computed(() => Math.ceil(this.funcionesFiltradas().length / this.porPagina));
  funcionesDeLaPagina = computed(() => {
    const desde = this.pagina() * this.porPagina;
    return this.funcionesFiltradas().slice(desde, desde + this.porPagina);
  });
  peliculas = signal<Pelicula[]>([]);

  formatos: Formato[] = ['2D', '3D', '4D', '5D'];

  cargando = signal(false);
  mensajeError = signal('');
  mensajeOk = signal('');

  formFuncion = new FormGroup({
    peliculaId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    formato: new FormControl<Formato>('2D', { nonNullable: true, validators: [Validators.required] }),
    idioma: new FormControl<'castellano' | 'subtitulada'>('castellano', { nonNullable: true }),
    fecha: new FormControl('', { nonNullable: true, validators: [Validators.required, fechaValidator()] }),
    hora: new FormControl('', { nonNullable: true, validators: [Validators.required, horaValidator()] }),
    hasta: new FormControl('', { nonNullable: true, validators: [fechaValidator()] }),
  });

  dias = [
    { numero: 1, nombre: 'Lun' },
    { numero: 2, nombre: 'Mar' },
    { numero: 3, nombre: 'Mié' },
    { numero: 4, nombre: 'Jue' },
    { numero: 5, nombre: 'Vie' },
    { numero: 6, nombre: 'Sáb' },
    { numero: 0, nombre: 'Dom' },
  ];
  diasElegidos = signal<number[]>([]);

  horasRapidas = ['14:00', '16:30', '19:00', '21:30', '23:45'];

  constructor(
    private funcionesService: Funciones,
    private peliculasService: Peliculas,
    private salasService: Salas,
    private actividades: Actividades,
  ) {}

  ngOnInit() {
    this.cargarFunciones();
    this.cargarPeliculas();
  }

  private async cargarFunciones() {
    const { data, error } = await this.funcionesService.traerTodas();
    if (error) {
      this.mensajeError.set('No se pudieron cargar las funciones.');
      return;
    }
    this.funciones.set(data ?? []);
  }

  private async cargarPeliculas() {
    const { data } = await this.peliculasService.traerTodas();
    this.peliculas.set((data ?? []).filter(p => p.estado === 'cartelera'));
  }

  formatearFecha(event: Event, campo: 'fecha' | 'hasta') {
    this.formFuncion.controls[campo].setValue(ponerBarras((event.target as HTMLInputElement).value));
  }

  formatearHora(event: Event) {
    this.formFuncion.controls.hora.setValue(ponerDosPuntos((event.target as HTMLInputElement).value));
  }

  alternarDia(numero: number) {
    this.diasElegidos.update(lista =>
      lista.includes(numero) ? lista.filter(d => d !== numero) : [...lista, numero]
    );
  }

  async guardar() {
    this.mensajeError.set('');
    this.mensajeOk.set('');

    const valores = this.formFuncion.getRawValue();
    const pelicula = this.peliculas().find(p => p.id === Number(valores.peliculaId));
    if (!pelicula) {
      this.mensajeError.set('Elegí una película.');
      return;
    }

    const inicioPrimera = `${aFechaBase(valores.fecha)}T${valores.hora}`;

    const horarios: string[] = [];
    if (!valores.hasta) {
      horarios.push(inicioPrimera);
    } else {
      if (this.diasElegidos().length === 0) {
        this.mensajeError.set('Elegí al menos un día de la semana para repetir.');
        return;
      }
      const hora = valores.hora;
      let dia = aFechaBase(valores.fecha);
      const hasta = aFechaBase(valores.hasta);
      while (dia <= hasta) {
        if (this.diasElegidos().includes(new Date(dia + 'T00:00').getDay())) {
          horarios.push(`${dia}T${hora}`);
        }
        dia = this.sumarMinutos(dia + 'T00:00', 24 * 60).slice(0, 10);
      }
      if (horarios.length === 0) {
        this.mensajeError.set('Ninguna fecha del rango cae en los días elegidos.');
        return;
      }
      if (horarios.length > 60) {
        this.mensajeError.set('Son demasiadas funciones juntas: como máximo 60 por vez.');
        return;
      }
    }

    if (new Date(horarios[0]) <= new Date()) {
      this.mensajeError.set('La función tiene que ser en el futuro.');
      return;
    }

    this.cargando.set(true);
    let creadas = 0;
    let ultimaSala = '';
    const sinSala: string[] = [];
    for (const inicio of horarios) {
      const sala = await this.crearUna(pelicula, inicio, valores.formato, valores.idioma);
      if (sala) {
        creadas++;
        ultimaSala = sala;
      } else {
        sinSala.push(`${inicio.slice(8, 10)}/${inicio.slice(5, 7)} ${inicio.slice(11)}`);
      }
    }
    this.cargando.set(false);

    if (horarios.length === 1 && creadas === 1) {
      this.mensajeOk.set(`Función creada: ${pelicula.nombre} en ${ultimaSala} (${valores.formato}).`);
    } else if (creadas > 0) {
      this.mensajeOk.set(`Se crearon ${creadas} funciones de ${pelicula.nombre} (${valores.formato}).`);
    }
    if (sinSala.length) {
      this.mensajeError.set(`No había sala ${valores.formato} libre (con 30 min de margen) para: ${sinSala.join(', ')}.`);
    }
    if (creadas > 0) {
      this.formFuncion.reset();
      this.diasElegidos.set([]);
      await this.cargarFunciones();
    }
  }

  private async crearUna(pelicula: Pelicula, inicio: string, formato: Formato, idioma: 'castellano' | 'subtitulada') {
    const fin = this.sumarMinutos(inicio, pelicula.duracion_min);

    const salas = await this.salasService.traerPorFormato(formato);
    if (salas.error || !salas.data?.length) {
      return null;
    }

    const ids = salas.data.map(s => s.id);
    const solapadas = await this.funcionesService.traerSolapadas(
      ids,
      this.sumarMinutos(inicio, -30),
      this.sumarMinutos(fin, 30),
    );
    if (solapadas.error) {
      return null;
    }
    const ocupadas = solapadas.data.map(f => f.sala_id);

    const salaLibre = salas.data.find(s => !ocupadas.includes(s.id));
    if (!salaLibre) {
      return null;
    }

    const { error } = await this.funcionesService.crear({
      pelicula_id: pelicula.id,
      sala_id: salaLibre.id,
      inicio,
      fin,
      formato,
      idioma,
    });
    if (error) {
      return null;
    }
    await this.actividades.registrar(
      `Creó la función de ${pelicula.nombre} el ${this.textoFecha(inicio)} en ${salaLibre.nombre} (${formato}, ${idioma})`
    );
    return salaLibre.nombre;
  }

  private textoFecha(fecha: string) {
    return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(0, 4)} ${fecha.slice(11, 16)}`;
  }

  async borrar(funcion: Funcion) {
    if (!confirm(`¿Borrar la función de ${funcion.peliculas?.nombre}?`)) {
      return;
    }
    const { error } = await this.funcionesService.borrar(funcion.id);
    if (error) {
      this.mensajeError.set('No se pudo borrar la función.');
      return;
    }
    await this.actividades.registrar(
      `Borró la función de ${funcion.peliculas?.nombre} del ${this.textoFecha(funcion.inicio)} (${funcion.salas?.nombre})`
    );
    await this.cargarFunciones();
  }

  private sumarMinutos(fecha: string, minutos: number) {
    const d = new Date(fecha);
    d.setMinutes(d.getMinutes() + minutos);
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
  }
}
