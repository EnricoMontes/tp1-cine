import { computed, inject, Service, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from './supabase';
import { Notificacion } from '../modelos/notificacion';

@Service()
export class Notificaciones {
  private supabase = inject(Supabase);

  lista = signal<Notificacion[]>([]);
  noLeidas = computed(() => this.lista().filter(n => !n.leida).length);

  private canal: RealtimeChannel | null = null;

  async empezar(usuarioId: string) {
    this.terminar();
    const { data } = await this.supabase.cliente
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });
    this.lista.set(data ?? []);

    this.canal = this.supabase.cliente
      .channel(`notificaciones-${usuarioId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${usuarioId}` },
        payload => {
          const nueva = payload.new as Notificacion;
          this.lista.update(lista => [nueva, ...lista]);
          this.mostrarDelSistema(nueva);
        },
      )
      .subscribe();
  }

  async pedirPermiso() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  private async mostrarDelSistema(notificacion: Notificacion) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    const opciones = { body: notificacion.mensaje, icon: 'icons/icon-192x192.png' };
    const registro = await navigator.serviceWorker?.getRegistration();
    if (registro) {
      registro.showNotification(notificacion.titulo, opciones);
    } else {
      new Notification(notificacion.titulo, opciones);
    }
  }

  terminar() {
    if (this.canal) {
      this.supabase.cliente.removeChannel(this.canal);
      this.canal = null;
    }
    this.lista.set([]);
  }

  async marcarLeidas(usuarioId: string) {
    if (this.noLeidas() === 0) {
      return;
    }
    await this.supabase.cliente
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', usuarioId)
      .eq('leida', false);
    this.lista.update(lista => lista.map(n => ({ ...n, leida: true })));
  }
}
