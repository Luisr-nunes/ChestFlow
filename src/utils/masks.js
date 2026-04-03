/**
 * Input Masks — Máscaras de entrada para campos monetários
 */

export function applyMoneyMask(input) {
    if (!input) return;
    input.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (!v) { e.target.value = ''; return; }
        v = (parseInt(v, 10) / 100).toFixed(2);
        e.target.value = v.replace('.', ',');
    });
    input.addEventListener('focus', () => setTimeout(() => input.select(), 50));
}
