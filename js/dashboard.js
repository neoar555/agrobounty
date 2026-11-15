// ==========================================
// LÓGICA EXCLUSIVA DEL TABLERO (DASHBOARD)
// ==========================================

let lotesCache = [];
let nombreActual = '';
let miUsuarioId = '';

// --- 1. PANEL DE NOTIFICACIONES ---
function abrirNotificaciones() {
    const modal = document.getElementById('modalNotif');
    const badge = document.getElementById('contadorNotif');
    
    if (modal) modal.classList.remove('hidden');
    
    // Al abrir el panel, marcamos las alertas como vistas ocultando el indicador rojo
    if (badge) {
        badge.style.display = 'none';
        localStorage.setItem('ultimaLecturaNotif', Date.now().toString());
    }
}

function cerrarNotificaciones() {
    const modal = document.getElementById('modalNotif');
    if (modal) modal.classList.add('hidden');
}

function actualizarPanelNotificaciones(lotes) {
    const listaNotif = document.getElementById('listaNotificaciones');
    const badge = document.getElementById('contadorNotif');
    if (!listaNotif || !badge) return;

    // Filtrar los lotes más recientes publicados por otros productores (máximo 5 alertas)
    const lotesRecientes = lotes
        .filter(lote => !(lote.usuario_id && lote.usuario_id == miUsuarioId) && !(lote.nombre_productor && lote.nombre_productor === nombreActual))
        .slice(0, 5);

    if (lotesRecientes.length === 0) {
        listaNotif.innerHTML = `<p class="text-xs text-center" style="color: #64748b; padding: 1rem 0;">No hay notificaciones nuevas por el momento.</p>`;
        badge.style.display = 'none';
        return;
    }

    // Verificar cuáles son nuevas desde la última vez que se abrió el modal
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
}

// --- 2. RENDERIZADO Y FILTRADO DE LOTES ---
function renderizarLotes(lotesARenderizar) {
    const contenedorLotes = document.getElementById('listaLotes');
    if (!contenedorLotes) return;

    if (!lotesARenderizar || lotesARenderizar.length === 0) {
        const textoBusqueda = document.getElementById('inputBusqueda')?.value.trim();
        const mensajeVacio = textoBusqueda 
            ? `No se encontraron cosechas que coincidan con "${textoBusqueda}".` 
            : 'No hay lotes publicados todavía.';
        contenedorLotes.innerHTML = `<p class="text-xs text-center" style="color: #64748b; padding: 1.5rem 0;">${mensajeVacio}</p>`;
        return;
    }

    contenedorLotes.innerHTML = '';
    lotesARenderizar.forEach(lote => {
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
}

function filtrarLotes() {
    const input = document.getElementById('inputBusqueda');
    const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
    if (!input) return;

    const termino = input.value.toLowerCase().trim();

    if (btnLimpiar) {
        if (termino.length > 0) {
            btnLimpiar.classList.remove('hidden');
        } else {
            btnLimpiar.classList.add('hidden');
        }
    }

    if (!termino) {
        renderizarLotes(lotesCache);
        return;
    }

    const filtrados = lotesCache.filter(lote => {
        const producto = (lote.tipoProducto || '').toLowerCase();
        const productor = (lote.nombre_productor || '').toLowerCase();
        const idLote = String(lote.id || '');
        return producto.includes(termino) || productor.includes(termino) || idLote.includes(termino);
    });

    renderizarLotes(filtrados);
}

function limpiarBusqueda() {
    const input = document.getElementById('inputBusqueda');
    if (input) {
        input.value = '';
        filtrarLotes();
        input.focus();
    }
}

// --- 3. CARGA Y ACTUALIZACIÓN DESDE SUPABASE ---
async function cargarLotes(esManual = false) {
    const contenedorLotes = document.getElementById('listaLotes');
    const btnActualizar = document.getElementById('btnActualizar');
    if (!contenedorLotes) return;

    if (esManual && btnActualizar) {
        btnActualizar.textContent = '⏳ Actualizando...';
        btnActualizar.disabled = true;
    }

    try {
        const { data: lotes, error } = await supabaseClient
            .from('lotes_alimentos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        lotesCache = lotes || [];
        actualizarPanelNotificaciones(lotesCache);
        
        // Respeta el filtro si el usuario tiene algo escrito en la barra de búsqueda
        filtrarLotes();

    } catch (err) {
        console.error('Error al cargar datos:', err);
        contenedorLotes.innerHTML = `<p class="text-xs text-center" style="color: #dc2626; padding: 1rem 0;">Error al cargar datos de Supabase.</p>`;
    } finally {
        if (esManual && btnActualizar) {
            setTimeout(() => {
                btnActualizar.textContent = '🔄 Actualizar';
                btnActualizar.disabled = false;
            }, 400);
        }
    }
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    const lblUsuario = document.getElementById('lblUsuario');
    nombreActual = localStorage.getItem('usuarioAgroBounty');
    miUsuarioId = localStorage.getItem('usuarioId');
    
    // Validar sesión activa
    if (!nombreActual && !miUsuarioId) {
        window.location.href = 'index.html';
        return;
    }

    if (lblUsuario) {
        lblUsuario.textContent = `Hola, ${nombreActual}`;
    }

    await cargarLotes(false);
});

// ==========================================
// CAPTURA DE INSTALACIÓN PWA
// ==========================================
let deferredPromptPWA;

window.addEventListener('beforeinstallprompt', (e) => {
    // Evita que el navegador muestre su barra predeterminada por su cuenta
    e.preventDefault();
    
    // Guarda el evento para usarlo después
    deferredPromptPWA = e;
    
    // Muestra tu banner o botón personalizado de instalación
    const banner = document.getElementById('bannerInstalar');
    if (banner) {
        banner.classList.remove('hidden');
    }
});

// Evento al hacer clic en el botón de instalar
document.addEventListener('DOMContentLoaded', () => {
    const btnInstalar = document.getElementById('btnEjecutarInstalacion');
    if (btnInstalar) {
        btnInstalar.addEventListener('click', async () => {
            if (!deferredPromptPWA) return;
            
            // Muestra el aviso nativo de instalación del sistema
            deferredPromptPWA.prompt();
            
            // Espera la respuesta del usuario
            const { outcome } = await deferredPromptPWA.userChoice;
            if (outcome === 'accepted') {
                console.log('El usuario aceptó instalar AgroBounty');
            }
            
            // Limpia la variable ya que el prompt solo se puede usar una vez
            deferredPromptPWA = null;
            
            // Oculta el banner
            const banner = document.getElementById('bannerInstalar');
            if (banner) banner.classList.add('hidden');
        });
    }
});

//

let promptInstalacionGlobal = null;

window.addEventListener('beforeinstallprompt', (e) => {
    // Previene el banner automático del navegador
    e.preventDefault();
    // Guarda el evento en la variable global
    promptInstalacionGlobal = e;
    console.log("¡Evento beforeinstallprompt capturado con éxito!");
});