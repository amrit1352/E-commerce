/**
 * UI: loading screen, scroll-to-top, dark mode, mobile nav, animations
 */
window.RN = window.RN || {};

RN.initUI = function () {
    document.documentElement.style.scrollBehavior = 'smooth';

    // Loading screen
    const loader = document.querySelector('.page-loader');
    if (loader) {
        window.addEventListener('load', () => {
            loader.classList.add('loaded');
            setTimeout(() => loader.remove(), 600);
        });
        setTimeout(() => loader.classList.add('loaded'), 2500);
    }

    // Scroll to top
    const scrollBtn = document.querySelector('.scroll-top-btn');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            scrollBtn.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
        scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Sticky navbar shadow
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
    }

    // Mobile menu
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const open = navLinks.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', open);
            document.body.classList.toggle('nav-open', open);
        });
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                navLinks.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('nav-open');
            });
        });
    }

    // Dark mode
    const themeBtn = document.querySelector('.theme-toggle');
    const savedTheme = RN.storage.getItem(RN.CONFIG.THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeBtn?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        RN.storage.setItem(RN.CONFIG.THEME_KEY, next);
    });

    // Promotional banner dismiss
    const promoClose = document.querySelector('.promo-banner-close');
    const promoBanner = document.querySelector('.promo-banner');
    if (promoClose && promoBanner) {
        if (RN.storage.getItem('rn_promo_dismissed') === '1') promoBanner.classList.add('is-hidden');
        promoClose.addEventListener('click', () => {
            promoBanner.classList.add('is-hidden');
            RN.storage.setItem('rn_promo_dismissed', '1');
        });
    }

    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const wasOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
            if (!wasOpen) item.classList.add('open');
            btn.setAttribute('aria-expanded', !wasOpen);
        });
    });

    // Newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    newsletterForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]')?.value?.trim();
        const msg = newsletterForm.querySelector('.newsletter-msg');
        if (!email) return;
        const subs = RN.parseJSON(RN.storage.getItem('rn_newsletter'), []);
        if (!subs.includes(email)) subs.push(email);
        RN.storage.setItem('rn_newsletter', JSON.stringify(subs));
        if (msg) {
            msg.textContent = 'Thank you for subscribing!';
            msg.className = 'newsletter-msg success';
        }
        newsletterForm.reset();
    });

    // Contact form
    const contactForm = document.getElementById('contactForm');
    contactForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = contactForm.querySelector('.contact-msg');
        const entries = RN.parseJSON(RN.storage.getItem('rn_contacts'), []);
        entries.unshift({
            name: contactForm.name.value.trim(),
            email: contactForm.email.value.trim(),
            message: contactForm.message.value.trim(),
            date: new Date().toISOString()
        });
        RN.storage.setItem('rn_contacts', JSON.stringify(entries.slice(0, 50)));
        if (msg) {
            msg.textContent = 'Message sent! We will reply soon.';
            msg.className = 'contact-msg success';
        }
        contactForm.reset();
    });

    // Live chat placeholder
    document.querySelector('.live-chat-btn')?.addEventListener('click', () => {
        alert('Live chat coming soon! Contact us on WhatsApp or email support@rnreadymade.com');
    });

    // Reveal on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

    RN.trackVisitor();
};
