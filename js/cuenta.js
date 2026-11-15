// ==========================================
// LÓGICA DE MI CUENTA, PERFIL Y GESTIÓN DE LOTES
// ==========================================

const miUsuarioId = localStorage.getItem('usuarioId');
let nombreActual = localStorage.getItem('usuarioAgroBounty') || 'Noé Armenta';
let correoActual = localStorage.getItem('correoAgroBounty') || 'noe@agrobounty.com';

let idLoteAEliminar = null; // Guardará el ID exacto del lote a eliminar

document.addEventListener('DOMContentLoaded', async () => {
    if (!miUsuarioId && !nombreActual) {
        window.location.href = 'index.html';
        return;
    }

    if (miUsuarioId) {
        try {
            const { data: user } = await supabaseClient
                .from('usuarios')
                .select('*')
                .eq('id', miUsuarioId)
                .maybeSingle();

            if (user) {
                nombreActual = user.nombre || nombreActual;
                correoActual = user.correo || correoActual;
                localStorage.setItem('usuarioAgroBounty', nombreActual);
                localStorage.setItem('correoAgroBounty', correoActual);
            }
        } catch (err) {
            console.error('Error al sincronizar datos del usuario:', err);
        }
    }

    actualizarUI();
    cargarMisPublicaciones();
    cargarNotificacionesPerfil();

    // Evento para confirmar la eliminación del lote desde el modal
    const btnConfirmarEliminacion = document.getElementById('btnConfirmarEliminacion');
    if (btnConfirmarEliminacion) {
        btnConfirmarEliminacion.addEventListener('click', async () => {
            if (!idLoteAEliminar) return;

            try {
                const { error } = await supabaseClient
                    .from('lotes_alimentos')
                    .delete()
                    .eq('id', idLoteAEliminar);

                if (error) throw error;

                cerrarModalBorrar();
                cargarMisPublicaciones();
                alert('¡Publicación eliminada por completo de la base de datos!');
            } catch (err) {
                console.error('Error al eliminar lote:', err);
                alert('Ocurrió un error al intentar borrar la publicación de Supabase.');
            }
        });
    }
});

// --- PANEL DE NOTIFICACIONES SINCRONIZADO ---
async function cargarNotificacionesPerfil() {
    const listaNotif = document.getElementById('listaNotificaciones');
    const badge = document.getElementById('contadorNotif');
    if (!listaNotif || !badge) return;

    try {
        const { data: lotes, error } = await supabaseClient
            .from('lotes_alimentos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(15);

        if (error) throw error;

        const lotesRecientes = (lotes || [])
            .filter(lote => !(lote.usuario_id && lote.usuario_id == miUsuarioId) && !(lote.nombre_productor && lote.nombre_productor === nombreActual))
            .slice(0, 5);

        if (lotesRecientes.length === 0) {
            listaNotif.innerHTML = `<p class="text-xs text-center" style="color: #64748b; padding: 1rem 0;">No hay notificaciones nuevas por el momento.</p>`;
            badge.style.display = 'none';
            return;
        }

        const ultimaLectura = parseInt(localStorage.getItem('ultimaLecturaNotif') || '0', 10);
        let nuevasSinLeer = 0;

        listaNotif.innerHTML = '';
        lotesRecientes.forEach(lote => {
            const fechaCreacion = lote.created_at ? new Date(lote.created_at).getTime() : Date.now();
            const esNueva = fechaCreacion > ultimaLectura;
            if (esNueva) nuevasSinLeer++;

            const unidad = lote.unidadMedida === 'Kg' ? 'kg' : 't';
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 0.65rem;
                border-radius: 0.5rem;
                background-color: ${esNueva ? '#f0fdf4' : '#f8fafc'};
                border: 1px solid ${esNueva ? '#bbf7d0' : '#e2e8f0'};
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.5rem;
            `;

            item.innerHTML = `
                <div>
                    <p class="text-xs font-bold" style="color: #1e293b; text-transform: capitalize;">🌾 Nueva subasta: ${lote.tipoProducto}</p>
                    <p class="text-xs" style="color: #475569; margin-top: 0.15rem;">${lote.pesoKg} ${unidad} • Por ${lote.nombre_productor || 'Productor Local'}</p>
                </div>
                <a href="detalle.html?id=${lote.id}" class="btn-sm-green" style="padding: 0.35rem 0.5rem; font-size: 11px; white-space: nowrap;">Ver</a>
            `;
            listaNotif.appendChild(item);
        });

        if (nuevasSinLeer > 0) {
            badge.textContent = nuevasSinLeer;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error('Error al cargar notificaciones:', err);
    }
}

function abrirNotificaciones() { 
    const modal = document.getElementById('modalNotif');
    const badge = document.getElementById('contadorNotif');
    if (modal) modal.classList.remove('hidden'); 
    if (badge) {
        badge.style.display = 'none';
        localStorage.setItem('ultimaLecturaNotif', Date.now().toString());
    }
}

function cerrarNotificaciones() { 
    const modal = document.getElementById('modalNotif');
    if (modal) modal.classList.add('hidden'); 
}

// --- GESTIÓN DE PERFIL Y MIS PUBLICACIONES ---
function actualizarUI() {
    const lblNombre = document.getElementById('lblNombrePerfil');
    const lblCorreo = document.getElementById('lblCorreoPerfil');
    const avatar = document.getElementById('avatarLetra');
    const editNombre = document.getElementById('editNombre');
    const editCorreo = document.getElementById('editCorreo');

    if (lblNombre) lblNombre.textContent = nombreActual;
    if (lblCorreo) lblCorreo.textContent = correoActual;
    if (avatar) avatar.textContent = nombreActual.charAt(0).toUpperCase();
    
    if (editNombre) editNombre.value = nombreActual;
    if (editCorreo) editCorreo.value = correoActual;
}

// Cargar publicaciones asegurando compatibilidad con los nombres de columnas
async function cargarMisPublicaciones() {
    const contenedor = document.getElementById('listaMisPublicaciones');
    if (!contenedor) return;
    
    if (!miUsuarioId) {
        contenedor.innerHTML = '<p class="text-xs" style="color: #64748b; text-align: center;">Inicia sesión con ID válido para ver tus lotes.</p>';
        return;
    }

    try {
        const { data: lotes, error } = await supabaseClient
            .from('lotes_alimentos')
            .select('*')
            .eq('usuario_id', miUsuarioId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!lotes || lotes.length === 0) {
            contenedor.innerHTML = '<p class="text-xs" style="color: #64748b; text-align: center; padding: 0.5rem 0;">No tienes publicaciones registradas todavía.</p>';
            return;
        }

        contenedor.innerHTML = '';
        lotes.forEach(lote => {
            const tituloLote = lote.titulo || lote.tipoProducto || lote.producto || lote.nombre || 'Lote de alimento';
            const precioLote = lote.precio_inicial || lote.precioBase || lote.precio || lote.monto || '0';
            const pesoLote = lote.pesoKg || 'Peso no disponible';
            const unimedLote = lote.unidadMedida || '';

            const card = document.createElement('div');
            card.style.cssText = "display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; gap: 0.5rem;";
            
            card.innerHTML = `
                <div style="overflow: hidden; max-width: 70%;">
                    <h4 style="font-size: 0.875rem; font-weight: bold; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: capitalize;">${tituloLote}</h4>
                    <p class="text-xs" style="color: #166534; font-weight: 600;">$${Number(precioLote).toLocaleString()} • ${pesoLote} ${unimedLote}</p>
                </div>
                <button onclick="confirmarEliminarLote('${lote.id}')" style="background-color: #fee2e2; color: #991b1b; border: none; padding: 0.4rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: bold; cursor: pointer; white-space: nowrap;">
                    🗑️ Eliminar
                </button>
            `;
            contenedor.appendChild(card);
        });

    } catch (err) {
        console.error('Error cargando publicaciones:', err);
        contenedor.innerHTML = '<p class="text-xs" style="color: #ef4444; text-align: center;">Error al cargar tus publicaciones.</p>';
    }
}

function confirmarEliminarLote(id) {
    idLoteAEliminar = id;
    const modal = document.getElementById('modalConfirmarBorrar');
    if (modal) modal.classList.remove('hidden');
}

function cerrarModalBorrar() {
    idLoteAEliminar = null;
    const modal = document.getElementById('modalConfirmarBorrar');
    if (modal) modal.classList.add('hidden');
}

async function guardarCambiosPerfil() {
    const editNombre = document.getElementById('editNombre');
    const editCorreo = document.getElementById('editCorreo');
    const nuevoNombre = editNombre ? editNombre.value.trim() : '';
    const nuevoCorreo = editCorreo ? editCorreo.value.trim() : '';

    if (!nuevoNombre || !nuevoCorreo) {
        alert('Por favor completa tu nombre y correo.');
        return;
    }

    try {
        if (miUsuarioId) {
            const { error } = await supabaseClient
                .from('usuarios')
                .update({ nombre: nuevoNombre, correo: nuevoCorreo })
                .eq('id', miUsuarioId);

            if (error) throw error;
        }

        localStorage.setItem('usuarioAgroBounty', nuevoNombre);
        localStorage.setItem('correoAgroBounty', nuevoCorreo);
        
        nombreActual = nuevoNombre;
        correoActual = nuevoCorreo;
        actualizarUI();

        alert('¡Perfil actualizado con éxito!');
    } catch (err) {
        console.error('Error al actualizar:', err);
        alert('Ocurrió un error al guardar los cambios.');
    }
}

function cerrarSesion() {
    if (confirm('¿Deseas cerrar sesión?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

async function eliminarCuenta() {
    if (confirm('¿Estás seguro de eliminar tu cuenta permanentemente?')) {
        if (miUsuarioId) {
            try {
                await supabaseClient.from('usuarios').delete().eq('id', miUsuarioId);
            } catch (err) {
                console.error('Error al eliminar usuario:', err);
            }
        }
        localStorage.clear();
        alert('Cuenta eliminada.');
        window.location.href = 'index.html';
    }
}