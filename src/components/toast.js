export function showToast(message, type = 'success') {
    document.getElementById('toast')?.remove();
    const colors = { 
        success: '#27ae60', 
        error: '#e74c3c', 
        info: '#2980b9',
        warning: '#f39c12'
    };
    const el = document.createElement('div');
    el.id = 'toast';
    el.className = `toast-${type}`;
    el.style.cssText = `
        position: fixed; bottom: 28px; right: 28px; z-index: 9999;
        background: ${colors[type] || colors.success}; color: #fff;
        padding: 12px 20px; border-radius: 10px;
        font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 16px rgba(0,0,0,.18);
        animation: slideIn .25s ease;
        pointer-events: none;
        font-family: inherit;
    `;
    el.textContent = message;
    document.body.appendChild(el);

    setTimeout(() => {
        el.style.animation = 'slideOut .25s ease forwards';
        setTimeout(() => el.remove(), 250);
    }, 2800);
}