/**
 * Smooth Scroll Management - El Palleter
 * Archivo: src/scripts/smooth-scroll.js
 * 
 * Maneja el scroll suave con offset del header para todos los enlaces internos
 */

export function initSmoothScroll() {
    // Función para obtener la altura del header dinámicamente
    const getHeaderHeight = () => {
        const header = document.querySelector('#header');
        return header ? header.getBoundingClientRect().height : 80; // Fallback a 80px
    };

    // Función principal de smooth scroll CON offset del header
    const smoothScrollTo = (targetId) => {
        console.log(`Smooth scroll to: #${targetId}`); // Debug log
        
        const target = document.querySelector(`#${targetId}`);
        if (target) {
            console.log(`Target encontrado:`, target); // Debug log
            
            // Obtener la altura actual del header
            const headerHeight = getHeaderHeight();
            
            // Calcular posición con offset del header
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Usar un pequeño delay para que el scroll termine antes de limpiar la URL
            setTimeout(() => {
                // Limpiar la URL sin afectar el historial
                history.replaceState(null, null, window.location.pathname + window.location.search);
            }, 100);
        } else {
            console.error(`Target NO encontrado: #${targetId}`); // Debug log
            
            // Listar todas las secciones disponibles para debug
            const allSections = document.querySelectorAll('section[id]');
            console.log('Secciones disponibles:', 
                Array.from(allSections).map(s => `#${s.id}`)
            );
        }
    };

    // Función para manejar todos los elementos con data-scroll-to
    const handleScrollElements = () => {
        const scrollElements = document.querySelectorAll('[data-scroll-to]');
        console.log(`Elementos con data-scroll-to encontrados: ${scrollElements.length}`); // Debug log
        
        scrollElements.forEach((element, index) => {
            const target = element.getAttribute('data-scroll-to');
            const exists = document.querySelector(`#${target}`) ? 'Exists' : 'Doesnt exist';
            console.log(`${index + 1}. ${exists} data-scroll-to="${target}"`); // Debug log
            
            // Remover listeners existentes para evitar duplicados
            element.removeEventListener('click', handleScrollClick);
            element.addEventListener('click', handleScrollClick);
        });
    };

    // Handler para clicks de scroll
    const handleScrollClick = (e) => {
        console.log('🖱️ Click en elemento data-scroll-to detectado'); // Debug log
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('data-scroll-to');
        if (targetId) {
            smoothScrollTo(targetId);
        }
    };

    // Función para manejar enlaces con href="#section"
    const handleNavLinks = () => {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            // Remover listeners existentes para evitar duplicados
            link.removeEventListener('click', handleNavClick);
            link.addEventListener('click', handleNavClick);
        });
    };

    // Handler para clicks de navegación
    const handleNavClick = (e) => {
        console.log('Click en enlace href="#" detectado'); // Debug log
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        const targetId = href.substring(1); // Quitar el #
        if (targetId) {
            smoothScrollTo(targetId);
        }
    };

    // Función para manejar hash en la URL al cargar la página
    const handleInitialHash = () => {
        const hash = window.location.hash;
        if (hash) {
            const targetId = hash.substring(1);
            console.log(`🔗 Hash inicial detectado: ${hash}`); // Debug log
            // Pequeño delay para asegurar que la página esté completamente cargada
            setTimeout(() => smoothScrollTo(targetId), 100);
        }
    };

    // Función para manejar cambios en el hash de la URL
    const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash) {
            const targetId = hash.substring(1);
            console.log(`Hash cambió: ${hash}`); // Debug log
            smoothScrollTo(targetId);
        }
    };

    // Función para reinicializar todos los event listeners
    const initializeScrollBehavior = () => {
        handleScrollElements();
        handleNavLinks();
    };

    // Función pública para reinicializar (útil para componentes dinámicos)
    const reinitialize = () => {
        initializeScrollBehavior();
    };

    // Inicializar al cargar la página
    initializeScrollBehavior();
    handleInitialHash();

    // Escuchar cambios en el hash de la URL
    window.addEventListener('hashchange', handleHashChange);

    // Función de limpieza para cuando sea necesario
    const cleanup = () => {
        window.removeEventListener('hashchange', handleHashChange);
        // Limpiar todos los event listeners si es necesario
        const scrollElements = document.querySelectorAll('[data-scroll-to]');
        scrollElements.forEach(element => {
            element.removeEventListener('click', handleScrollClick);
        });
        
        const navLinks = document.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.removeEventListener('click', handleNavClick);
        });
    };

    // Retornar API pública
    return {
        reinitialize,
        cleanup,
        smoothScrollTo // Exponer función para uso manual si es necesario
    };
}

// Auto-inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.smoothScrollAPI = initSmoothScroll();
});

// Para uso en módulos ES6
export default initSmoothScroll;