/**
 * Internationalization — English & Nepali
 */
window.RN = window.RN || {};

RN.i18n = {
    en: {
        home: 'Home', men: 'Men', women: 'Women', collections: 'Collections',
        shopNow: 'Shop Now', exploreWomen: 'Explore Women', newArrivals: 'New Arrivals',
        bestSellers: 'Best Sellers', featured: 'Featured', addToCart: 'Add to Cart',
        viewDetails: 'View Details', searchPlaceholder: 'Search fashion...',
        cart: 'Cart', signUp: 'Sign Up', logout: 'Logout', wishlist: 'Wishlist',
        compare: 'Compare', checkout: 'Checkout', subtotal: 'Subtotal',
        shipping: 'Shipping', tax: 'Tax (13%)', discount: 'Discount', total: 'Total',
        freeShipping: 'Free shipping on orders over Rs. 5,000',
        testimonials: 'What Our Customers Say', faq: 'Frequently Asked Questions',
        newsletter: 'Join Our Newsletter', contact: 'Contact Us', footerRights: 'All rights reserved.'
    },
    ne: {
        home: 'गृह', men: 'पुरुष', women: 'महिला', collections: 'संग्रह',
        shopNow: 'अहिले किनमेल', exploreWomen: 'महिला हेर्नुहोस्', newArrivals: 'नयाँ आगमन',
        bestSellers: 'सर्वाधिक बिक्री', featured: 'विशेष', addToCart: 'कार्टमा थप्नुहोस्',
        viewDetails: 'विवरण हेर्नुहोस्', searchPlaceholder: 'फेसन खोज्नुहोस्...',
        cart: 'कार्ट', signUp: 'दर्ता', logout: 'लगआउट', wishlist: 'इच्छा सूची',
        compare: 'तुलना', checkout: 'चेकआउट', subtotal: 'उप-कुल',
        shipping: 'ढुवानी', tax: 'कर (१३%)', discount: 'छुट', total: 'कुल',
        freeShipping: 'Rs. ५,००० भन्दा माथि निःशुल्क ढुवानी',
        testimonials: 'हाम्रा ग्राहकहरूको भनाइ', faq: 'बारम्बार सोधिने प्रश्नहरू',
        newsletter: 'न्युजलेटर सदस्यता', contact: 'सम्पर्क', footerRights: 'सर्वाधिकार सुरक्षित।'
    }
};

RN.currentLang = () => RN.storage.getItem(RN.CONFIG.LANG_KEY) || 'en';

RN.t = (key) => {
    const lang = RN.currentLang();
    return RN.i18n[lang]?.[key] || RN.i18n.en[key] || key;
};

RN.applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const text = RN.t(key);
        if (text) {
            if (el.tagName === 'INPUT' && el.placeholder !== undefined) el.placeholder = text;
            else el.textContent = text;
        }
    });
    document.documentElement.lang = RN.currentLang() === 'ne' ? 'ne' : 'en';
};

RN.initI18n = () => {
    const langBtn = document.querySelector('.lang-toggle');
    RN.applyTranslations();
    langBtn?.addEventListener('click', () => {
        const next = RN.currentLang() === 'en' ? 'ne' : 'en';
        RN.storage.setItem(RN.CONFIG.LANG_KEY, next);
        RN.applyTranslations();
        langBtn.textContent = next === 'en' ? 'ने' : 'EN';
    });
    if (langBtn) langBtn.textContent = RN.currentLang() === 'en' ? 'ने' : 'EN';
};
