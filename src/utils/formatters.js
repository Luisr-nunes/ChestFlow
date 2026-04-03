/**
 * Formatters — Funções de formatação de dados
 */

export function fmtMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

export function fmtDate(iso) {
    try {
        if (!iso) return '-';
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch {
        return iso;
    }
}

export function getYearsRange() {
    const thisYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => thisYear - 5 + i);
}
