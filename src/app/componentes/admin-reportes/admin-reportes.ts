import { Component, computed, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Reportes, Venta } from '../../servicios/reportes';
import { Candy } from '../../servicios/candy';
import { aFechaPantalla } from '../../validadores/fecha.validadores';

interface Barra {
  nombre: string;
  cantidad: number;
}

@Component({
  imports: [CurrencyPipe],
  selector: 'app-admin-reportes',
  styleUrl: './admin-reportes.css',
  templateUrl: './admin-reportes.html',
})
export class AdminReportes implements OnInit {
  ventas = signal<Venta[]>([]);
  candy = signal<Barra[]>([]);
  cargando = signal(true);
  mensajeError = signal('');

  porDia = computed(() => {
    const dias: { fecha: string; total: number; entradas: number }[] = [];
    for (const venta of this.ventas()) {
      const fecha = this.fechaLocal(venta.creado_en);
      let dia = dias.find(d => d.fecha === fecha);
      if (!dia) {
        dia = { fecha, total: 0, entradas: 0 };
        dias.push(dia);
      }
      dia.total += Number(venta.total);
      dia.entradas += Number(venta.entradas);
    }
    return dias.sort((a, b) => b.fecha.localeCompare(a.fecha));
  });
  totalFacturado = computed(() => this.porDia().reduce((suma, d) => suma + d.total, 0));
  totalEntradas = computed(() => this.porDia().reduce((suma, d) => suma + d.entradas, 0));

  periodo = signal<'semana' | 'mes'>('semana');
  masVistas = computed(() => {
    const dias = this.periodo() === 'semana' ? 7 : 30;
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    const barras: Barra[] = [];
    for (const venta of this.ventas()) {
      if (new Date(venta.creado_en) < desde) {
        continue;
      }
      let barra = barras.find(b => b.nombre === venta.pelicula);
      if (!barra) {
        barra = { nombre: venta.pelicula, cantidad: 0 };
        barras.push(barra);
      }
      barra.cantidad += Number(venta.entradas);
    }
    return barras.sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
  });

  constructor(private reportesService: Reportes, private candyService: Candy) {}

  async ngOnInit() {
    const { data, error } = await this.reportesService.traerVentas();
    if (error) {
      this.mensajeError.set('No se pudieron cargar los reportes.');
    }
    this.ventas.set(data ?? []);

    const productos = await this.candyService.traerProductos(false);
    const combos = await this.candyService.traerCombos(false);
    const barras: Barra[] = [
      ...(productos.data ?? []).map(p => ({ nombre: p.nombre, cantidad: p.vendidos })),
      ...(combos.data ?? []).map(c => ({ nombre: c.nombre, cantidad: c.vendidos })),
    ];
    this.candy.set(barras.sort((a, b) => b.cantidad - a.cantidad));
    this.cargando.set(false);
  }

  ancho(cantidad: number, barras: Barra[]) {
    const maximo = barras[0]?.cantidad || 1;
    return (cantidad / maximo) * 100 + '%';
  }

  private fechaLocal(fecha: string) {
    const d = new Date(fecha);
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
  }

  fechaPantalla(fecha: string) {
    return aFechaPantalla(fecha);
  }

  exportarExcel() {
    const filas = this.porDia().map(d => ({
      Fecha: aFechaPantalla(d.fecha),
      'Entradas vendidas': d.entradas,
      'Facturación ($)': d.total,
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Facturación');
    XLSX.writeFile(libro, 'facturacion-signalcine.xlsx');
  }

  exportarPdf() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('SignalCine · Facturación por día', 20, 20);
    doc.setFontSize(11);
    doc.text('Fecha', 20, 35);
    doc.text('Entradas', 80, 35);
    doc.text('Facturación', 130, 35);
    let y = 45;
    for (const dia of this.porDia()) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(aFechaPantalla(dia.fecha), 20, y);
      doc.text(String(dia.entradas), 80, y);
      doc.text(`$${dia.total.toFixed(2)}`, 130, y);
      y += 8;
    }
    doc.text(`Total: ${this.totalEntradas()} entradas · $${this.totalFacturado().toFixed(2)}`, 20, y + 6);
    doc.save('facturacion-signalcine.pdf');
  }
}
