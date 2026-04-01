import { invoke } from '@tauri-apps/api/core';



export async function invokeSafe(command, args = {}) {
    try {
        return await invoke(command, args);
    } catch (error) {
        console.error(`Erro no Rust ao chamar ${command}:`, error);
        throw error;
    }
}

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

export function getYearsRange() {
    const thisYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => thisYear - 5 + i);
}