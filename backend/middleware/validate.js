const validator = require('validator');

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const RAW_KEYS = new Set(['password', 'passwordHash', 'confirm', 'confirmPassword', 'images', 'image', 'url', 'hex']);

function sanitizeBody(req, _res, next) {
    const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        Object.keys(obj).forEach((key) => {
            if (RAW_KEYS.has(key)) return;
            if (typeof obj[key] === 'string') {
                obj[key] = escapeHtml(validator.trim(obj[key]));
            } else if (typeof obj[key] === 'object') {
                walk(obj[key]);
            }
        });
        return obj;
    };
    if (req.body) walk(req.body);
    next();
}

module.exports = { sanitizeBody, escapeHtml };
