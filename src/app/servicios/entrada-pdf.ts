import { Service } from '@angular/core';
import { toDataURL } from 'qrcode';
import { jsPDF } from 'jspdf';
import { DatosEntradaPdf } from '../modelos/compra';

@Service()
export class EntradaPdf {
  generarQr(codigo: string) {
    const link = `${window.location.origin}/empleado/${codigo}`;
    return toDataURL(link, { width: 300, margin: 1 });
  }

  async descargar(datos: DatosEntradaPdf) {
    const qr = await this.generarQr(datos.codigo);

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text('SignalCine', 20, 25);
    doc.setFontSize(12);
    doc.text('Entrada', 20, 33);

    doc.setFontSize(16);
    doc.text(datos.pelicula, 20, 50);

    doc.setFontSize(12);
    doc.text(`Fecha y hora: ${new Date(datos.inicio).toLocaleString('es-AR')}`, 20, 62);
    doc.text(`${datos.sala} · ${datos.formato} · ${datos.idioma}`, 20, 70);
    doc.text(`Butacas: ${datos.butacas}`, 20, 78);
    doc.text(`Total pagado: $${datos.total}`, 20, 86);

    if (datos.candy) {
      doc.text(doc.splitTextToSize(`Candy: ${datos.candy}`, 170), 20, 94);
    }

    if (datos.restriccion) {
      doc.text(`Película +${datos.restriccion}: los menores deben asistir acompañados de un adulto.`, 20, 104);
    }

    doc.addImage(qr, 'PNG', 70, 110, 70, 70);
    doc.setFontSize(10);
    doc.text('Presentá este QR en la entrada de la sala y en el candy.', 105, 190, { align: 'center' });
    doc.text(`Código: ${datos.codigo}`, 105, 197, { align: 'center' });

    doc.save(`entrada-${datos.codigo.slice(0, 8)}.pdf`);
  }
}
