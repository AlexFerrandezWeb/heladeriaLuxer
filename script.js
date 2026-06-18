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

    // Reescribe los enlaces internos al idioma elegido para que el menú,
    // el logo, el footer, etc. lleven a la versión correcta sin recargar.
    function relocalizeLinks(lang) {
        document.querySelectorAll('a[href^="/"]').forEach(a => {
            let href = a.getAttribute('href');
            if (!href || href.startsWith('/assets') || href.startsWith('//')) return;
            // quita el prefijo de idioma actual si lo tuviera
            href = href.replace(/^\/(en|fr)(\/|$)/, '/');
            // añade el prefijo del idioma destino (es no lleva prefijo)
            if (lang !== 'es') {
                href = href === '/' ? '/' + lang + '/' : '/' + lang + href;
            }
            a.setAttribute('href', href);
        });
    }

    // Actualiza el <title> y la meta description al idioma elegido (datos
    // generados por el build en meta_i18n.js). Así también cambia la pestaña.
    function applyMeta(lang) {
        const data = window.META_I18N && window.META_I18N[lang];
        const m = data && data[getPageSlug()];
        if (!m) return;
        if (m.title) document.title = m.title;
        const desc = document.querySelector('meta[name="description"]');
        if (desc && m.description) desc.setAttribute('content', m.description);
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

    // Pastilla deslizante que resalta el idioma activo
    const langToggle = document.querySelector('.language-toggle');
    let langIndicator = null;
    if (langToggle && languageButtons.length) {
        langIndicator = document.createElement('span');
        langIndicator.className = 'language-toggle__indicator';
        langIndicator.setAttribute('aria-hidden', 'true');
        langToggle.prepend(langIndicator);
    }

    function activeLangBtn() {
        return document.querySelector('.language-toggle__btn.active')
            || document.querySelector('.language-toggle__btn[data-lang="' + getCurrentLang() + '"]');
    }

    // Coloca la pastilla sobre un botón. animate=false la sitúa sin transición.
    function moveLangIndicator(btn, animate) {
        if (!langIndicator || !btn) return;
        if (!animate) langIndicator.style.transition = 'none';
        langIndicator.style.left = btn.offsetLeft + 'px';
        langIndicator.style.top = btn.offsetTop + 'px';
        langIndicator.style.width = btn.offsetWidth + 'px';
        langIndicator.style.height = btn.offsetHeight + 'px';
        langIndicator.style.opacity = '1';
        if (!animate) {
            void langIndicator.offsetWidth; // fuerza reflow
            langIndicator.style.transition = '';
        }
    }

    // Posición inicial (sin animación) y recolocación al redimensionar / cargar
    requestAnimationFrame(() => moveLangIndicator(activeLangBtn(), false));
    window.addEventListener('load', () => moveLangIndicator(activeLangBtn(), false));
    window.addEventListener('resize', () => moveLangIndicator(activeLangBtn(), false));

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

    // Cambio de idioma sin recargar (traduce en sitio + actualiza la URL)
    languageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            if (!SUPPORTED_LANGS.includes(lang)) return;
            localStorage.setItem('preferredLanguage', lang);
            const changed = lang !== getCurrentLang();
            // Cambio de idioma sin recargar: traduce textos, reescribe los
            // enlaces internos y actualiza la URL con history.pushState.
            applyLanguage(lang);
            relocalizeLinks(lang);
            applyMeta(lang);
            if (changed) {
                history.pushState({ lang }, '', urlForLang(lang));
            }
            moveLangIndicator(btn, true);
        });
    });

    // Botón atrás/adelante del navegador: reaplica el idioma de la URL
    window.addEventListener('popstate', () => {
        const lang = getCurrentLang();
        applyLanguage(lang);
        relocalizeLinks(lang);
        applyMeta(lang);
        moveLangIndicator(activeLangBtn(), true);
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

    // La nav solo está agrandada (con logo) cuando se está arriba del todo.
    // En cuanto se baja un poco, se compacta y se mantiene así hasta volver
    // al principio (no vuelve a crecer al hacer scroll hacia arriba).
    const nav = document.querySelector('.nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            nav.classList.add('nav--compact');
        } else {
            nav.classList.remove('nav--compact');
        }
        toTop.classList.toggle('is-visible', window.scrollY > 400);
    });

    // La franja de precios (sticky) se pega justo debajo de la nav. Como la
    // nav cambia de altura al hacer scroll (con transición de ~1.2s), aquí
    // sincronizamos su 'top' con la altura real de la nav en cada momento,
    // siguiéndola también mientras la barra se agranda/encoge.
    const priceLegend = document.querySelector('.legend-sticky');
    if (priceLegend) {
        const GAP = 0;
        let followId = null;
        let stopTimer = null;
        const syncLegendTop = () => {
            priceLegend.style.top = (nav.offsetHeight + GAP) + 'px';
        };
        const follow = () => {
            syncLegendTop();
            followId = requestAnimationFrame(follow);
        };
        const stopFollow = () => {
            if (followId) { cancelAnimationFrame(followId); followId = null; }
            syncLegendTop();
        };
        syncLegendTop();
        window.addEventListener('load', syncLegendTop);
        window.addEventListener('resize', syncLegendTop);
        window.addEventListener('scroll', syncLegendTop, { passive: true });
        // Mientras la nav anima su tamaño, seguimos su altura cada frame
        nav.addEventListener('transitionrun', () => {
            if (!followId) follow();
            clearTimeout(stopTimer);
            stopTimer = setTimeout(stopFollow, 1400);
        });
    }

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