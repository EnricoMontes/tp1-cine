import { inject, Service } from '@angular/core';
import { Supabase } from './supabase';
import { PeliculaDatos } from '../modelos/pelicula';

@Service()
export class Peliculas {
  private supabase = inject(Supabase);

  traerCartelera() {
    return this.supabase.cliente
      .from('peliculas')
      .select('*, generos(*)')
      .eq('estado', 'cartelera')
      .eq('visible_en_home', true)
      .order('nombre');
  }

  traerProximamente() {
    return this.supabase.cliente
      .from('peliculas')
      .select('*, generos(*)')
      .eq('estado', 'proximamente')
      .eq('visible_en_home', true)
      .order('fecha_estreno');
  }

  traerMasVendidas() {
    return this.supabase.cliente
      .from('peliculas_mas_vendidas')
      .select('pelicula_id, entradas_vendidas')
      .order('entradas_vendidas', { ascending: false });
  }

  traerPorId(id: number) {
    return this.supabase.cliente
      .from('peliculas')
      .select('*, generos(*)')
      .eq('id', id);
  }

  traerTodas() {
    return this.supabase.cliente
      .from('peliculas')
      .select('*, generos(*)')
      .order('nombre');
  }

  traerGeneros() {
    return this.supabase.cliente
      .from('generos')
      .select('*')
      .order('nombre');
  }

  crear(pelicula: PeliculaDatos) {
    return this.supabase.cliente
      .from('peliculas')
      .insert([pelicula])
      .select();
  }

  modificar(id: number, pelicula: PeliculaDatos) {
    return this.supabase.cliente
      .from('peliculas')
      .update(pelicula)
      .eq('id', id);
  }

  borrar(id: number) {
    return this.supabase.cliente
      .from('peliculas')
      .delete()
      .eq('id', id);
  }

  async subirPoster(archivo: File) {
    const path = `posters/${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    const { error } = await this.supabase.cliente.storage
      .from('peliculas')
      .upload(path, archivo, { cacheControl: '3600', upsert: false });
    if (error) {
      return { url: null, error };
    }

    const url = this.supabase.cliente.storage.from('peliculas').getPublicUrl(path).data.publicUrl;
    return { url, error: null };
  }

  async guardarGeneros(peliculaId: number, generoIds: number[]) {
    const borrado = await this.supabase.cliente
      .from('peliculas_generos')
      .delete()
      .eq('pelicula_id', peliculaId);
    if (borrado.error) {
      return borrado;
    }

    if (generoIds.length === 0) {
      return borrado;
    }

    const filas = generoIds.map(generoId => ({ pelicula_id: peliculaId, genero_id: generoId }));
    return this.supabase.cliente
      .from('peliculas_generos')
      .insert(filas);
  }
}
