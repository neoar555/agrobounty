// ==========================================
// LÓGICA DE AUTENTICACIÓN (LOGIN Y REGISTRO)
// ==========================================

// Función global para alternar la visibilidad de la contraseña
function togglePasswordVisibility(fieldId, btn) {
    const inputField = document.getElementById(fieldId);
    if (inputField.type === 'password') {
        inputField.type = 'text';
        btn.textContent = '👁️‍🗨️'; // Cambia el icono para indicar que está visible
    } else {
        inputField.type = 'password';
        btn.textContent = '👁️';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');

    // Cambiar de vista: Mostrar Registro
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });
    }

    // Cambiar de vista: Mostrar Login
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    // Manejar el envío del formulario de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const correo = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            try {
                const { data: usuario, error } = await supabaseClient
                    .from('usuarios')
                    .select('*')
                    .eq('correo', correo)
                    .eq('pin_acceso', password)
                    .maybeSingle();

                if (error || !usuario) {
                    alert('Correo o contraseña incorrectos.');
                } else {
                    localStorage.setItem('usuarioAgroBounty', usuario.nombre || usuario.correo);
                    localStorage.setItem('correoAgroBounty', usuario.correo);
                    localStorage.setItem('usuarioId', usuario.id);
                    window.location.href = 'dashboard.html';
                }
            } catch (err) {
                console.error('Error de red o servidor:', err);
            }
        });
    }

    // Manejar el envío del formulario de Registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('regNombre').value.trim();
            const correo = document.getElementById('regEmail').value.trim();
            const telefono = document.getElementById('regPhone').value.trim();
            const password = document.getElementById('regPassword').value.trim();

            try {
                const { data, error } = await supabaseClient
                    .from('usuarios')
                    .insert([
                        { 
                            correo: correo, 
                            pin_acceso: password, 
                            nombre: nombre, 
                            phone: telefono 
                        }
                    ])
                    .select();

                if (error) {
                    alert('Error al registrar: ' + error.message);
                } else {
                    alert(`¡Cuenta creada con éxito para ${nombre}!`);
                    localStorage.setItem('usuarioAgroBounty', nombre);
                    localStorage.setItem('correoAgroBounty', correo);
                    localStorage.setItem('usuarioId', data[0]?.id || '');
                    window.location.href = 'dashboard.html';
                }
            } catch (err) {
                console.error('Error de red o servidor:', err);
            }
        });
    }
});