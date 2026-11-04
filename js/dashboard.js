// ==========================================
// LÓGICA EXCLUSIVA DEL TABLERO (DASHBOARD)
// ==========================================

function abrirNotificaciones() {
    const modal = document.getElementById('modalNotif');
    if (modal) modal.classList.remove('hidden');
}

function cerrarNotificaciones() {
    const modal = document.getElementById('modalNotif');
    if (modal) modal.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
    const lblUsuario = document.getElementById('lblUsuario');
    const nombreActual = localStorage.getItem('usuarioAgroBounty');
    const miUsuarioId = localStorage.getItem('usuarioId');
    
    // Validar sesión activa
    if (!nombreActual && !miUsuarioId) {
        window.location.href = 'index.html';
        return;
    }

    if (lblUsuario) {
        lblUsuario.textContent = `Hola, ${nombreActual}`;
    }

    // Cargar Lotes desde Supabase
    const contenedorLotes = document.getElementById('listaLotes');
    if (!contenedorLotes) return;

    try {
        const { data: lotes, error } = await supabaseClient
            .from('lotes_alimentos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!lotes || lotes.length === 0) {
            contenedorLotes.innerHTML = `<p class="text-xs text-center" style="color: #64748b; padding: 1rem 0;">No hay lotes publicados todavía.</p>`;
            return;
        }

        contenedorLotes.innerHTML = '';
        lotes.forEach(lote => {
            const esMiLote = (lote.usuario_id && lote.usuario_id == miUsuarioId) || 
                             (lote.nombre_productor && lote.nombre_productor === nombreActual);

            let accionBotonHTML = '';
            if (esMiLote) {
                accionBotonHTML = `
                    <span class="badge-disabled">
                        🔒 Tu Publicación
                    </span>
                `;
            } else {
                accionBotonHTML = `
                    <a href="detalle.html?id=${lote.id}" class="btn-sm-green" style="display: inline-block; text-decoration: none;">
                        🔍 Ver Detalle
                    </a>
                `;
            }

            // Validar unidad de medida (Kg o Ton)
            const unidadMedida = lote.unidadMedida || 'Ton';
            const etiquetaUnidad = unidadMedida === 'Kg' ? 'kg' : 't';
            const etiquetaPrecio = unidadMedida === 'Kg' ? 'MXN/kg' : 'MXN/t';

            // Usar la foto real subida a Supabase, o la de respaldo si no existe
            const fotoAMostrar = lote.foto_url || obtenerImagenProducto(lote.tipoProducto);

            const card = document.createElement('div');
            card.className = 'lote-card';
            
            card.innerHTML = `
                <img src="${fotoAMostrar}" alt="${lote.tipoProducto}" class="lote-img">
                <div class="lote-body">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 class="font-bold text-sm" style="color: #1e293b; text-transform: capitalize; margin: 0;">${lote.tipoProducto}</h3>
                            <p class="text-xs" style="color: #15803d; font-weight: 600; margin: 0.25rem 0 0 0;">👨‍🌾 Productor: ${lote.nombre_productor || 'Productor Local'}</p>
                            <p class="text-xs" style="color: #94a3b8; margin: 0;">Lote: #${lote.id}</p>
                        </div>
                        <span class="badge-time">
                            ${calcularTiempoRestante(lote.fechaExpiracion)}
                        </span>
                    </div>
                    <p class="text-xs" style="color: #475569; margin: 0;">⚖️ <strong>Cantidad:</strong> ${lote.pesoKg} ${etiquetaUnidad}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.5rem; border-top: 1px solid #f1f5f9;">
                        <div>
                            <span class="text-xs" style="color: #94a3b8; display: block;">Precio base</span>
                            <span style="font-weight: 800; color: #15803d; font-size: 0.875rem;">$${lote.precioBase.toLocaleString()} ${etiquetaPrecio}</span>
                        </div>
                        ${accionBotonHTML}
                    </div>
                </div>
            `;
            contenedorLotes.appendChild(card);
        });

    } catch (err) {
        console.error('Error al cargar datos:', err);
        contenedorLotes.innerHTML = `<p class="text-xs text-center" style="color: #dc2626; padding: 1rem 0;">Error al cargar datos de Supabase.</p>`;
    }
});