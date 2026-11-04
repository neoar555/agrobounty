// ==========================================
// LÓGICA DE DETALLE DEL LOTE Y PUJAS
// ==========================================

let loteActual = null;

// Función para limpiar el texto del GPS y mostrar sólo Municipio/Estado o Ubicación legible
function formatearUbicacion(coordenadasGPS) {
    if (!coordenadasGPS) return 'Ubicación no especificada';
    
    let limpia = coordenadasGPS.replace(/📍/g, '').replace(/<[^>]*>?/gm, '').trim();
    
    if (limpia.includes('Lat:')) {
        limpia = limpia.split('Lat:')[0].trim();
    }
    if (limpia.includes('(')) {
        limpia = limpia.split('(')[0].trim();
    }

    return limpia || 'Municipio no especificado';
}

function abrirModalOferta(precioBase) {
    const inputOferta = document.getElementById('montoOferta');
    const modal = document.getElementById('modalOferta');
    if (inputOferta) inputOferta.value = precioBase + 500;
    if (modal) modal.classList.remove('hidden');
}

function cerrarModalOferta() {
    const modal = document.getElementById('modalOferta');
    if (modal) modal.classList.add('hidden');
}

function enviarOferta() {
    const inputOferta = document.getElementById('montoOferta');
    const oferta = inputOferta ? inputOferta.value : null;

    if (!oferta || oferta <= 0) {
        alert('Por favor ingresa un monto válido.');
        return;
    }

    const nombreProductor = loteActual?.nombre_productor || 'Productor';
    const producto = loteActual?.tipoProducto || 'cosecha';
    const loteId = loteActual?.id || '';

    const mensaje = `Hola ${nombreProductor}, me interesa el lote #${loteId} de ${producto}. Quisiera hacer una oferta de subasta por $${parseInt(oferta).toLocaleString()} MXN por tonelada.`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
    cerrarModalOferta();
}

function contactarWhatsApp(productor, producto, loteId) {
    const mensaje = `Hola ${productor}, me interesa solicitar información sobre tu lote #${loteId} de ${producto}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const loteId = params.get('id');
    const contenedor = document.getElementById('contenedorDetalle');

    const miUsuarioId = localStorage.getItem('usuarioId');
    const nombreActual = localStorage.getItem('usuarioAgroBounty');

    if (!loteId) {
        if (contenedor) {
            contenedor.innerHTML = `<p class="text-xs text-center" style="color: #ef4444;">No se especificó un lote válido.</p>`;
        }
        return;
    }

    try {
        const { data: lote, error } = await supabaseClient
            .from('lotes_alimentos')
            .select('*')
            .eq('id', loteId)
            .single();

        if (error || !lote) throw new Error('Lote no encontrado');

        loteActual = lote;

        // Validar si el lote le pertenece al usuario logueado
        const esMiLote = (lote.usuario_id && lote.usuario_id == miUsuarioId) || 
                         (lote.nombre_productor && lote.nombre_productor === nombreActual);

        const nombreProductorReal = lote.nombre_productor || 'Productor Local';
        const ubicacionLimpia = formatearUbicacion(lote.coordenadasGPS);

        // Usa función global de main.js como respaldo si no hay foto_url
        const fotoAMostrar = lote.foto_url || obtenerImagenProducto(lote.tipoProducto);

        let accionBotonHTML = '';
        if (esMiLote) {
            accionBotonHTML = `
                <div class="badge-disabled" style="width: 100%; padding: 0.75rem 0;">
                    🔒 Tu Publicación (No puedes ofertar en tu propio lote)
                </div>
            `;
        } else {
            accionBotonHTML = `
                <div class="space-y-4">
                    <button onclick="abrirModalOferta(${lote.precioBase})" class="btn-green" style="padding: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        🙋‍♂️ Realizar Puja / Subastar
                    </button>
                    <button onclick="contactarWhatsApp('${nombreProductorReal}', '${lote.tipoProducto}', ${lote.id})" style="width: 100%; background-color: #dcfce7; color: #166534; font-weight: 700; font-size: 0.75rem; padding: 0.625rem; border-radius: 0.5rem; border: none; cursor: pointer;">
                        💬 Contactar a ${nombreProductorReal} vía WhatsApp
                    </button>
                </div>
            `;
        }

        if (contenedor) {
            contenedor.innerHTML = `
                <img src="${fotoAMostrar}" alt="${lote.tipoProducto}" class="lote-img" style="height: 12rem; border-radius: 0.75rem;">
                
                <div class="space-y-4">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; text-transform: capitalize; margin: 0;">${lote.tipoProducto}</h2>
                        <span class="badge-time">
                            ${calcularTiempoRestante(lote.fechaExpiracion)}
                        </span>
                    </div>
                    
                    <p class="text-xs" style="color: #15803d; font-weight: 600; margin: 0;">👨‍🌾 Productor: ${nombreProductorReal}</p>
                    <p class="text-xs" style="color: #64748b; font-weight: 500; margin: 0;">📍 <strong>Ubicación:</strong> ${ubicacionLimpia}</p>
                    <p class="text-xs" style="color: #94a3b8; margin: 0;">Lote #${lote.id}</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9;" class="text-xs">
                    <div style="background-color: #f8fafc; padding: 0.75rem; border-radius: 0.5rem;">
                        <span style="color: #94a3b8; display: block;">Cantidad Disponible</span>
                        <strong style="color: #334155; font-size: 0.875rem;">${lote.pesoKg} toneladas</strong>
                    </div>
                    <div style="background-color: #f8fafc; padding: 0.75rem; border-radius: 0.5rem;">
                        <span style="color: #94a3b8; display: block;">Precio Base</span>
                        <strong style="color: #15803d; font-size: 0.875rem;">$${lote.precioBase.toLocaleString()} MXN/t</strong>
                    </div>
                </div>

                <div style="padding-top: 0.5rem;">
                    ${accionBotonHTML}
                </div>
            `;
        }

    } catch (err) {
        console.error(err);
        if (contenedor) {
            contenedor.innerHTML = `<p class="text-xs text-center" style="color: #ef4444;">Ocurrió un error al cargar la información del lote.</p>`;
        }
    }
});