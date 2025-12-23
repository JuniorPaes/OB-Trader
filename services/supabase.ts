
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

/**
 * CONEXÃO COM O NÚCLEO DE DADOS STARK (SUPABASE)
 * Utilizando a URL do projeto e a chave anon fornecida.
 */
const SUPABASE_URL = 'https://zarwnkkvhnqyhmtoxtr.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_qWjdBy1h5mAN6yzKvs6-TQ_LSaj9BjL'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Verifica se o uplink com a nuvem está configurado.
 * Agora retorna true pois a chave foi fornecida.
 */
export const isCloudReady = () => {
  // Fix: Cast SUPABASE_KEY to string to avoid TypeScript error when comparing literal type with placeholder string
  return (SUPABASE_KEY as string) !== 'SUA_CHAVE_ANON_DO_SUPABASE' && SUPABASE_URL.includes('supabase.co');
};
