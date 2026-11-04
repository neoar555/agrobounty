// ==========================================
// CONFIGURACIÓN GLOBAL Y UTILIDADES DE AGROBOUNTY
// ==========================================
const SUPABASE_URL = 'https://nxriaxzzvcrmzxxqghfl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Osb-UqwMymk_dnqNehpigw_kDuiDXhh'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Imagen de respaldo por si algún lote antiguo no tiene foto
function obtenerImagenProducto(nombre) {
    const n = (nombre || '').toLowerCase();
    if (n.includes('maíz') || n.includes('maiz')) return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&q=80';
    if (n.includes('tomate') || n.includes('jitomate')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80';
    if (n.includes('trigo')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&q=80';
    if (n.includes('aguacate')) return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80';
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80';
}

// Cálculo del tiempo restante de subasta
function calcularTiempoRestante(fechaExpiracionStr) {
    if (!fechaExpiracionStr) return 'Sin fecha';
    const fin = new Date(fechaExpiracionStr).getTime();
    const ahora = new Date().getTime();
    const dif = fin - ahora;

    if (dif <= 0) return '⏰ Expirado';

    const dias = Math.floor(dif / (1000 * 60 * 60 * 24));
    const horas = Math.floor((dif % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) return `⏳ ${dias}d ${horas}h restantes`;
    return `⏳ ${horas}h restantes`;
}