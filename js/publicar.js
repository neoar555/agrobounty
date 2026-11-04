// ==========================================
// LÓGICA DE PUBLICACIÓN DE COSECHAS Y GPS
// ==========================================

function actualizarEtiquetaPrecio() {
    const unidad = document.getElementById('unidadMedida').value;
    const labelPrecio = document.getElementById('labelPrecioBase');
    if (!labelPrecio) return;
    
    if (unidad === 'Ton') {
        labelPrecio.textContent = "Precio base por Tonelada (MXN)";
    } else {
        labelPrecio.textContent = "Precio base por Kilogramo (MXN)";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const usuarioId = localStorage.getItem('usuarioId');
    const nombreProductor = localStorage.getItem('usuarioAgroBounty');

    if (!usuarioId && !nombreProductor) {
        window.location.href = 'index.html';
        return;
    }

    // Geolocalización GPS
    const gpsStatus = document.getElementById('gpsStatus');
    if (gpsStatus && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                gpsStatus.textContent = "Obteniendo ubicación exacta de la parcela...";

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`, {
                        headers: { 'Accept-Language': 'es' }
                    });
                    const data = await response.json();
                    
                    if (data && data.address) {
                        const addr = data.address;
                        const localidad = addr.village || addr.localidad || addr.town || addr.hamlet || addr.suburb || addr.city || "";
                        const municipio = addr.municipality || addr.county || addr.city || "";
                        const estado = addr.state || "";
                        
                        let ubicacionTexto = "";
                        if (localidad && municipio && localidad !== municipio) {
                            ubicacionTexto = `${localidad}, ${municipio}, ${estado}`;
                        } else if (municipio) {
                            ubicacionTexto = `${municipio}, ${estado}`;
                        } else {
                            ubicacionTexto = `${localidad || 'Zona rural'}, ${estado}`;
                        }

                        gpsStatus.innerHTML = `📍 <b>${ubicacionTexto}</b><br><span style="font-size: 10px; color: #94a3b8;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</span>`;
                        gpsStatus.style.color = '#16a34a';
                        gpsStatus.style.fontWeight = '600';
                    } else {
                        gpsStatus.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (GPS Activo)`;
                        gpsStatus.style.color = '#16a34a';
                        gpsStatus.style.fontWeight = '600';
                    }
                } catch (error) {
                    gpsStatus.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (GPS Activo)`;
                    gpsStatus.style.color = '#16a34a';
                    gpsStatus.style.fontWeight = '600';
                }
            },
            (error) => {
                gpsStatus.textContent = '⚠️ Error: Activa el GPS para validar tu parcela.';
                gpsStatus.style.color = '#ef4444';
            },
            { enableHighAccuracy: true }
        );
    } else if (gpsStatus) {
        gpsStatus.textContent = 'Tu dispositivo no soporta geolocalización.';
    }

    const btnAbrirModal = document.getElementById('btnAbrirModal');
    const modalPago = document.getElementById('modalPago');
    const cerrarModal = document.getElementById('cerrarModal');
    const btnPagarYPublicar = document.getElementById('btnPagarYPublicar');

    if (btnAbrirModal && modalPago) {
        btnAbrirModal.addEventListener('click', () => {
            const tipo = document.getElementById('tipoProducto').value.trim();
            const peso = document.getElementById('pesoKilos').value.trim();
            const precio = document.getElementById('precioBase').value.trim();
            const expiracion = document.getElementById('fechaExpiracion').value;
            const fotoInput = document.getElementById('fotoLote');
            const foto = fotoInput ? fotoInput.files.length : 0;

            if(!tipo || !peso || !precio || !expiracion || foto === 0) {
                alert('Por favor, completa todos los campos del formulario y adjunta la foto del lote.');
                return;
            }
            modalPago.classList.remove('hidden');
        });
    }

    if (cerrarModal && modalPago) {
        cerrarModal.addEventListener('click', () => {
            modalPago.classList.add('hidden');
        });
    }

    // Al pagar, subimos la foto a Storage e insertamos el registro completo en Supabase
    if (btnPagarYPublicar) {
        btnPagarYPublicar.addEventListener('click', async () => {
            btnPagarYPublicar.textContent = "Publicando...";

            const tipo = document.getElementById('tipoProducto').value.trim();
            const pesoValor = parseFloat(document.getElementById('pesoKilos').value);
            const unidad = document.getElementById('unidadMedida').value;
            const precio = parseFloat(document.getElementById('precioBase').value);
            const expiracion = document.getElementById('fechaExpiracion').value;
            const gpsElement = document.getElementById('gpsStatus');
            const gps = gpsElement ? gpsElement.textContent : 'GPS no disponible';
            const archivoFoto = document.getElementById('fotoLote').files[0];

            try {
                let urlFotoFinal = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80'; // Respaldo por si acaso

                if (archivoFoto) {
                    const nombreArchivo = `lote_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
                    
                    // Subir la imagen al bucket 'fotos-lotes'
                    const { error: uploadError } = await supabaseClient.storage
                        .from('fotos-lotes')
                        .upload(nombreArchivo, archivoFoto);

                    if (uploadError) {
                        console.error("Error al subir imagen al Storage:", uploadError);
                    } else {
                        // Obtener la URL pública de la imagen
                        const { data: urlData } = supabaseClient.storage
                            .from('fotos-lotes')
                            .getPublicUrl(nombreArchivo);
                            
                        if (urlData && urlData.publicUrl) {
                            urlFotoFinal = urlData.publicUrl;
                        }
                    }
                }

                // Insertar en la tabla con la URL de la foto real
                const { error } = await supabaseClient
                    .from('lotes_alimentos')
                    .insert([
                        { 
                            tipoProducto: tipo, 
                            pesoKg: pesoValor, 
                            unidadMedida: unidad, 
                            precioBase: precio, 
                            fechaExpiracion: expiracion, 
                            coordenadasGPS: gps,
                            foto_url: urlFotoFinal, 
                            estadoLote: 'Publicado',
                            usuario_id: usuarioId,
                            nombre_productor: nombreProductor
                        }
                    ]);

                if (error) throw error;

                alert('¡Tu pago fue aprobado! Tu lote se ha publicado con éxito.');
                window.location.href = 'dashboard.html';

            } catch (err) {
                console.error('Error general:', err);
                alert('Hubo un error al registrar el lote.');
                btnPagarYPublicar.textContent = "Pagar $80 MXN y Activar Lote";
            }
        });
    }
});