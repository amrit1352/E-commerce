/**
 * toast.js — Elegant, animated toast notification system for R.N Readymade
 */
window.RN = window.RN || {};

(function () {
    let container = null;

    function getContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.createElement('div');
            container.id = 'rnToastContainer';
            container.className = 'rn-toast-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Show a toast notification
     * @param {Object|string} options - Toast options or message string
     * @param {string} options.message - The text message to display
     * @param {string} [options.type='success'] - 'success' | 'info' | 'warning' | 'error'
     * @param {string} [options.title] - Optional title
     * @param {string} [options.actionText] - Optional action button text
     * @param {Function} [options.onAction] - Optional click handler for action button
     * @param {number} [options.duration=3500] - Duration in ms (0 for sticky)
     */
    RN.showToast = function (options) {
        if (typeof options === 'string') {
            options = { message: options, type: 'success' };
        }
        const {
            message = '',
            type = 'success',
            title = '',
            actionText = null,
            onAction = null,
            duration = 3500
        } = options;

        const cont = getContainer();
        const toast = document.createElement('div');
        toast.className = `rn-toast rn-toast-${type}`;

        const iconMap = {
            success: 'fa-solid fa-circle-check',
            info: 'fa-solid fa-circle-info',
            warning: 'fa-solid fa-triangle-exclamation',
            error: 'fa-solid fa-circle-exclamation'
        };
        const iconClass = iconMap[type] || iconMap.info;

        let actionBtnHtml = '';
        if (actionText && typeof onAction === 'function') {
            actionBtnHtml = `<button type="button" class="rn-toast-action">${RN.escapeHtml ? RN.escapeHtml(actionText) : actionText}</button>`;
        }

        toast.innerHTML = `
            <div class="rn-toast-icon"><i class="${iconClass}"></i></div>
            <div class="rn-toast-content">
                ${title ? `<div class="rn-toast-title">${RN.escapeHtml ? RN.escapeHtml(title) : title}</div>` : ''}
                <div class="rn-toast-message">${RN.escapeHtml ? RN.escapeHtml(message) : message}</div>
            </div>
            ${actionBtnHtml}
            <button type="button" class="rn-toast-close" aria-label="Close notification">&times;</button>
            <div class="rn-toast-progress" style="animation-duration: ${duration}ms"></div>
        `;

        if (actionText && onAction) {
            toast.querySelector('.rn-toast-action')?.addEventListener('click', (e) => {
                e.stopPropagation();
                onAction();
                dismiss();
            });
        }

        function dismiss() {
            if (toast.classList.contains('rn-toast-leaving')) return;
            toast.classList.add('rn-toast-leaving');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }

        toast.querySelector('.rn-toast-close')?.addEventListener('click', dismiss);

        cont.appendChild(toast);

        // Auto remove
        if (duration > 0) {
            setTimeout(dismiss, duration);
        }

        return { dismiss };
    };
})();
