import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Único punto de conexión con Supabase.
// Como los servicios son singleton, toda la app comparte este mismo cliente.
// Los demás servicios (auth, películas, compras...) lo inyectan en vez de crear el suyo.
@Service()
export class Supabase {
  readonly cliente: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
  );
}
