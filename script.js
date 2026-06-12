document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');
    const languageButtons = document.querySelectorAll('.language-toggle__btn');

    const SUPPORTED_LANGS = ['es', 'en', 'fr'];

    // Idioma actual según la URL: /en/.. -> en, /fr/.. -> fr, resto -> es
    function getCurrentLang() {
        const first = window.location.pathname.split('/').filter(Boolean)[0];
        return (first === 'en' || first === 'fr') ? first : 'es';
    }

    // Slug de la página (sin prefijo de idioma ni .html); '' = portada
    function getPageSlug() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts[0] === 'en' || parts[0] === 'fr') parts.shift();
        let last = (parts[parts.length - 1] || '').replace(/\.html$/, '');
        return last === 'index' ? '' : last;
    }

    // URL equivalente de la página actual en otro idioma
    function urlForLang(lang) {
        const slug = getPageSlug();
        const prefix = lang === 'es' ? '' : '/' + lang;
        return slug ? prefix + '/' + slug : prefix + '/';
    }

    // Aplica los textos del idioma (coherente con el HTML ya traducido).
    // El <title> lo deja el HTML estático (optimizado para SEO por idioma).
    function applyLanguage(lang) {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });
        document.querySelectorAll('[data-unavailable-text]').forEach(element => {
            if (translations[lang] && translations[lang]['no-disponible']) {
                element.setAttribute('data-unavailable-text', translations[lang]['no-disponible']);
            }
        });
        languageButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
    }

    // Inicializar con el idioma de la URL
    const currentLang = getCurrentLang();
    localStorage.setItem('preferredLanguage', currentLang);
    applyLanguage(currentLang);

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navList.classList.toggle('active');
    });

    // Cerrar el menú al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navList.classList.remove('active');
        });
    });

    // Cambio de idioma: navegar a la versión traducida de la misma página
    languageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            if (!SUPPORTED_LANGS.includes(lang)) return;
            localStorage.setItem('preferredLanguage', lang);
            if (lang === getCurrentLang()) {
                applyLanguage(lang);
            } else {
                window.location.href = urlForLang(lang);
            }
        });
    });

    // Carrusel
    const carousels = document.querySelectorAll('.carousel');
    
    carousels.forEach(carousel => {
        const container = carousel.closest('.carousel-container');
        const leftButton = container.querySelector('.carousel-button--left');
        const rightButton = container.querySelector('.carousel-button--right');
        const cards = carousel.querySelectorAll('.product-card');
        let currentIndex = 0;

        function getCardsPerView() {
            return window.innerWidth > 768 ? 3 : 1;
        }

        function updateCarousel() {
            const cardsPerView = getCardsPerView();
            const cardWidth = cards[0].offsetWidth;
            const gap = 20;
            const offset = currentIndex * (cardWidth + gap);
            
            if (window.innerWidth <= 768) {
                // En móvil, usar scroll nativo
                carousel.scrollTo({
                    left: offset,
                    behavior: 'smooth'
                });
            } else {
                // En desktop, usar transform
                carousel.style.transform = `translateX(-${offset}px)`;
            }
            updateButtons();
        }

        function updateButtons() {
            const cardsPerView = getCardsPerView();
            const maxIndex = cards.length - cardsPerView;
            
            // Ocultar flecha izquierda si estamos al inicio
            leftButton.style.display = currentIndex <= 0 ? 'none' : 'flex';
            
            // Ocultar flecha derecha si estamos al final
            const isAtEnd = window.innerWidth <= 768 
                ? carousel.scrollLeft >= (carousel.scrollWidth - carousel.clientWidth - 10)
                : currentIndex >= maxIndex;
            rightButton.style.display = isAtEnd ? 'none' : 'flex';
        }

        function scroll(direction) {
            const cardsPerView = getCardsPerView();
            const maxIndex = cards.length - cardsPerView;
            
            if (direction === 'left') {
                currentIndex = Math.max(0, currentIndex - cardsPerView);
            } else {
                currentIndex = Math.min(maxIndex, currentIndex + cardsPerView);
            }
            
            updateCarousel();
        }

        // Detectar scroll manual
        carousel.addEventListener('scroll', () => {
            if (window.innerWidth <= 768) {
                const cardWidth = cards[0].offsetWidth;
                const gap = 20;
                const scrollPosition = carousel.scrollLeft;
                currentIndex = Math.round(scrollPosition / (cardWidth + gap));
                updateButtons();
            }
        });

        leftButton.addEventListener('click', () => scroll('left'));
        rightButton.addEventListener('click', () => scroll('right'));

        // Inicializar
        updateButtons();

        // Actualizar al redimensionar la ventana
        window.addEventListener('resize', () => {
            const cardsPerView = getCardsPerView();
            const maxIndex = cards.length - cardsPerView;
            
            if (currentIndex > maxIndex) {
                currentIndex = Math.max(0, maxIndex);
            }
            
            updateCarousel();
        });
    });

    const bar = document.getElementById('cookie-bar');
    if (bar && !localStorage.getItem('cookiesAccepted')) {
        bar.style.display = 'flex';
    }
    const btn = document.getElementById('accept-cookies');
    if (btn) {
        btn.onclick = function() {
            localStorage.setItem('cookiesAccepted', 'yes');
            bar.style.display = 'none';
        };
    }

    // Pantalla de bienvenida (solo portada; la activa el script del <head>)
    const welcomeEl = document.getElementById('welcome');
    if (welcomeEl && document.documentElement.classList.contains('welcome-on')) {
        const wLang = getCurrentLang();
        const tr = translations[wLang] || translations.es;
        const hour = new Date().getHours();
        const part = hour < 13 ? 'morning' : (hour < 20 ? 'afternoon' : 'evening');
        const greetEl = document.getElementById('welcome-greeting');
        const subEl = document.getElementById('welcome-sub');
        if (greetEl && tr['welcome-' + part]) greetEl.textContent = tr['welcome-' + part];
        if (subEl && tr['welcome-sub-' + part]) subEl.textContent = tr['welcome-sub-' + part];
        sessionStorage.setItem('welcomeSeen', '1');
        let wDismissed = false;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const dismissWelcome = () => {
            if (wDismissed) return;
            wDismissed = true;
            if (reducedMotion) {
                welcomeEl.classList.add('is-hidden');
                return;
            }
            // Animación de salida: se derrite hacia abajo
            welcomeEl.classList.add('is-melting');
            const finishMelt = () => welcomeEl.classList.add('is-hidden');
            welcomeEl.addEventListener('animationend', (e) => {
                if (e.animationName === 'welcome-melt') finishMelt();
            });
            // Respaldo por si no llega el evento de fin de animación
            setTimeout(finishMelt, 1000);
        };
        // Solo se cierra con el botón "Ver la carta"
        const enterBtn = document.getElementById('welcome-enter');
        if (enterBtn) enterBtn.addEventListener('click', dismissWelcome);
    }

    // Botón flotante "Volver arriba"
    const toTop = document.createElement('button');
    toTop.className = 'back-to-top';
    toTop.setAttribute('aria-label', 'Volver arriba');
    toTop.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 15 12 9 18 15"></polyline></svg>';
    document.body.appendChild(toTop);
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Reducción del nav al hacer scroll SOLO hacia abajo, y restaurar al hacer scroll hacia arriba
    const nav = document.querySelector('.nav');
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60 && window.scrollY > lastScrollY) {
            nav.classList.add('nav--compact');
        } else if (window.scrollY < lastScrollY) {
            nav.classList.remove('nav--compact');
        }
        lastScrollY = window.scrollY;
        toTop.classList.toggle('is-visible', window.scrollY > 400);
    });

    // Animación de aparición de tarjetas al hacer scroll
    // En la portada NO se anima: las 6 categorías se muestran siempre, sin scroll.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isHome = getPageSlug() === '';
    const revealSelector = isHome
        ? '.product-card, .category-block'
        : '.category-card, .product-card, .category-block';
    const revealEls = document.querySelectorAll(revealSelector);
    if (!prefersReduced && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.classList.add('is-visible');
                    obs.unobserve(el);
                    // Limpia clases/estilos tras la animación para no interferir con el hover
                    setTimeout(() => {
                        el.classList.remove('reveal', 'is-visible');
                        el.style.transitionDelay = '';
                    }, 1200);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach((el, i) => {
            el.classList.add('reveal');
            el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms';
            io.observe(el);
        });
    }
});