export async function invokeSafe(command, args = {}) {
    const RUST_PORT = 5181; // Fixa por enquanto
    console.log(`Chamando backend (${command}) com args:`, args); // Log de depuração
    try {
        const response = await fetch(`http://localhost:${RUST_PORT}/${command}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
        });

        if (!response.ok) {
            let errText;
            try {
                errText = await response.text();
            } catch (e) {
                errText = response.statusText;
            }
            throw new Error(errText || `Erro ${response.status}: Falha na resposta do servidor`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro ao chamar o backend (${command}):`, error);
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
