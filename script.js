document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');
    const languageButtons = document.querySelectorAll('.language-toggle__btn');

    // Función para cambiar el idioma
    function changeLanguage(lang) {
        document.documentElement.lang = lang;
        // Actualizar el título según la página
        const currentPage = window.location.pathname.split('/').pop();
        let pageTitleKey = 'title_default';
        switch(currentPage) {
            case 'desayunos_postres.html':
                pageTitleKey = 'title_desayunos';
                break;
            case 'combinados.html':
                pageTitleKey = 'title_combinados';
                break;
            case 'bebidas.html':
                pageTitleKey = 'title_bebidas';
                break;
            case 'batidos.html':
                pageTitleKey = 'title_batidos';
                break;
            case 'granizados.html':
                pageTitleKey = 'title_granizados';
                break;
            case 'helados.html':
                pageTitleKey = 'title_helados';
                break;
            default:
                pageTitleKey = 'title_default';
        }
        document.title = translations[lang][pageTitleKey];

        // Actualizar todos los elementos con data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });

        // Actualizar elementos con data-unavailable-text
        document.querySelectorAll('[data-unavailable-text]').forEach(element => {
            const key = 'no-disponible';
            if (translations[lang][key]) {
                element.setAttribute('data-unavailable-text', translations[lang][key]);
            }
        });

        // Actualizar botones de idioma
        languageButtons.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Guardar la preferencia de idioma
        localStorage.setItem('preferredLanguage', lang);
    }

    // Cargar el idioma guardado o usar el predeterminado
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'es';
    changeLanguage(savedLanguage);

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

    // Cambio de idioma
    languageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            changeLanguage(lang);
        });
    });

    // Actualizar título según la página actual y el idioma
    const currentPage = window.location.pathname.split('/').pop();
    let pageTitleKey = 'title_default';
    switch(currentPage) {
        case 'desayunos_postres.html':
            pageTitleKey = 'title_desayunos';
            break;
        case 'combinados.html':
            pageTitleKey = 'title_combinados';
            break;
        case 'bebidas.html':
            pageTitleKey = 'title_bebidas';
            break;
        case 'batidos.html':
            pageTitleKey = 'title_batidos';
            break;
        case 'granizados.html':
            pageTitleKey = 'title_granizados';
            break;
        case 'helados.html':
            pageTitleKey = 'title_helados';
            break;
        default:
            pageTitleKey = 'title_default';
    }
    document.title = translations[savedLanguage][pageTitleKey];

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
    });
}); 