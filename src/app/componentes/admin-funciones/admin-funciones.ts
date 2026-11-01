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
import { FiltroPeliculasPipe } from '../../pipes/filtro-peliculas-pipe';
import { DuracionPipe } from '../../pipes/duracion-pipe';

@Component({
  imports: [ReactiveFormsModule, FormsModule, DatePipe, FiltroPeliculasPipe, DuracionPipe],
  selector: 'app-admin-funciones',
  styleUrl: './admin-funciones.css',
  templateUrl: './admin-funciones.html',
})
export class AdminFunciones implements OnInit {
  funciones = signal<Funcion[]>([]);

  busqueda = signal('');
  elegidaId = signal<number | null>(null);
  peliculaElegida = computed(() => this.peliculas().find(p => p.id === this.elegidaId()) ?? null);
  funcionesDeLaElegida = computed(() => this.funciones().filter(f => f.pelicula_id === this.elegidaId()));
  diasDeLaElegida = computed(() => {
    const dias: { fecha: string; funciones: Funcion[] }[] = [];
    for (const funcion of this.funcionesDeLaElegida()) {
      const fecha = funcion.inicio.slice(0, 10);
      const ultimo = dias[dias.length - 1];
      if (ultimo && ultimo.fecha === fecha) {
        ultimo.funciones.push(funcion);
      } else {
        dias.push({ fecha, funciones: [funcion] });
      }
    }
    return dias;
  });
  proximasPorPelicula = computed(() => {
    const ahora = new Date();
    const cantidades = new Map<number, number>();
    for (const funcion of this.funciones()) {
      if (new Date(funcion.inicio) > ahora) {
        cantidades.set(funcion.pelicula_id, (cantidades.get(funcion.pelicula_id) ?? 0) + 1);
      }
    }
    return cantidades;
  });
  funcionesProximas = computed(() => [...this.proximasPorPelicula().values()].reduce((a, b) => a + b, 0));
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
    this.peliculas.set((data ?? []).filter(p => p.estado === 'cartelera' || (p.estado === 'proximamente' && p.preventa_activa)));
  }

  formatearFecha(event: Event, campo: 'fecha' | 'hasta') {
    this.formFuncion.controls[campo].setValue(ponerBarras((event.target as HTMLInputElement).value));
  }

  formatearHora(event: Event) {
    this.formFuncion.controls.hora.setValue(ponerDosPuntos((event.target as HTMLInputElement).value));
  }

  elegir(pelicula: Pelicula) {
    if (this.elegidaId() === pelicula.id) {
      this.elegidaId.set(null);
      return;
    }
    this.elegidaId.set(pelicula.id);
    setTimeout(() => document.getElementById('funciones-elegida')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  programar(pelicula: Pelicula) {
    this.formFuncion.controls.peliculaId.setValue(pelicula.id);
    document.getElementById('formulario-funcion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  peliculaDelFormulario() {
    return this.peliculas().find(p => p.id === this.formFuncion.controls.peliculaId.value) ?? null;
  }

  cantidadProximas(peliculaId: number) {
    return this.proximasPorPelicula().get(peliculaId) ?? 0;
  }

  esPasada(funcion: Funcion) {
    return new Date(funcion.inicio) <= new Date();
  }

  textoDia(fecha: string) {
    return new Date(fecha + 'T00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  }

  diaMes(fecha: string | null) {
    return fecha ? `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}` : '';
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

    if (pelicula.estado === 'proximamente' && pelicula.fecha_estreno && horarios[0].slice(0, 10) < pelicula.fecha_estreno) {
      this.mensajeError.set('Las funciones de una película en preventa van desde el día del estreno.');
      return;
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
