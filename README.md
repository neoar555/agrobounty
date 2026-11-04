# AgroBounty (PWA)

AgroBounty es una aplicación web progresiva (PWA) diseñada como una plataforma de subastas exprés y comercialización agrícola, conectando directamente a productores con compradores interesados en lotes del campo.
La finalidad de nuestra app no es sólo hacer subastas y venta de productos agrícolas, también, ayudamos al medio ambiente y combatimos algunos objetivos ODS, evitando así el desperdicio de alimentos en el campo
por sobreproducción o por defectos estéticos, y a su vez, apoyamos al agricultor a cubrir sus gastos de la siembra y producción de su producto.

---

# Enlace del Proyecto
Puedes ver la aplicación funcionando en vivo en el siguiente enlace de GitHub Pages:
-> https://neoar555.github.io/agrobounty/

---

# Características Principales
Experiencia Nativa (PWA): Instalable en dispositivos móviles, con soporte para pantalla completa y funcionamiento offline básico mediante un Service Worker, ya que depende en su mayoría del internet.
Geolocalización: Integración con la API de OpenStreetMap para ubicar con precisión los ejidos de los lotes agrícolas.
Autenticación y Base de Datos: Gestión de usuarios y almacenamiento de productos en tiempo real utilizando Supabase.
Diseño Responsivo: Interfaz moderna y adaptada tanto para dispositivos móviles como de escritorio.

---

# Tecnologías Utilizadas
Frontend: HTML5, CSS3 y JavaScript modular.
Backend / Base de Datos: Supabase (Auth & Database).
Alojamiento: GitHub Pages.
PWA: Web App Manifest y Service Worker.

---

# Estructura del Repositorio
El proyecto se encuentra organizado bajo buenas prácticas de desarrollo web:

agrobounty/
assets/   # Iconos e imágenes del sistema
css/   # Estilos globales (style.css)
js/   # Scripts modulares (auth, dashboard, detalle, publicar, main)
index.html   # Página de inicio / Autenticación
dashboard.html   # Panel principal de subastas
publicar.html   # Formulario de creación de nuevos lotes
cuenta.html   # Perfil, gestión de sesión y vista de publicaciones
detalle.html   # Vista detallada de cada lote
nosotros.html   # Información del proyecto
manifest.json   # Configuración de la PWA
sw.js   # Service Worker para el manejo de caché
