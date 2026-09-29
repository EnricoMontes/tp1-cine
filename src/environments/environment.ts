// Datos de conexión al proyecto de Supabase.
// La publishable key es pública por diseño (viaja al navegador): lo que protege
// los datos son las políticas RLS de cada tabla, no esconder esta clave.
// La secret / service_role key NUNCA va en el front.
export const environment = {
  production: false,
  supabaseUrl: 'https://lmbjjsavhwzspogygufs.supabase.co',
  supabasePublishableKey: 'sb_publishable_NtwnDPc_nmIUJKmiYafY7w_1e196YJz',
};
