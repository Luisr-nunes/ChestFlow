/**
 * API Service — Comunicação com o backend Rust (Axum)
 * Ponto único de acesso para todas as chamadas HTTP
 */

const BACKEND_PORT = 5181;
const BASE_URL = `http://localhost:${BACKEND_PORT}`;

export async function invokeSafe(command, args = {}) {
    try {
        const response = await fetch(`${BASE_URL}/${command}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
        });

        if (!response.ok) {
            let errText;
            try { errText = await response.text(); }
            catch (e) { errText = response.statusText; }
            throw new Error(errText || `Erro ${response.status}: Falha na resposta do servidor`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro ao chamar o backend (${command}):`, error);
        throw error;
    }
}
