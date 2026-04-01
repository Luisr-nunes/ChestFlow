export function showConfirmModal(item, onConfirm) {
    const isRecurring = item.recurring === 1 || item.recurring_source_id !== null;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.6); display: flex; align-items: center;
        justify-content: center; z-index: 10000; animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.style.cssText = `
        background: var(--bg-card); color: var(--text-main);
        padding: 24px; border-radius: 12px; max-width: 400px; width: 90%;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: scaleUp 0.2s ease;
    `;

    let content = `<h3>Excluir Lançamento?</h3><p style="margin: 12px 0 24px; opacity: 0.8;">Esta ação não pode ser desfeita.</p>`;
    let buttons = '';

    if (isRecurring) {
        content = `<h3>Excluir Item Recorrente</h3><p style="margin: 12px 0 24px; opacity: 0.8;">Este item faz parte de uma recorrência. Como deseja prosseguir?</p>`;
        buttons = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="btnOnlyThis" class="btn-primary" style="background: var(--color-red);">Apenas este mês</button>
                <button id="btnAllFuture" class="btn-secondary">Este e todos os futuros</button>
                <button id="btnCancelModal" class="btn-ghost">Cancelar</button>
            </div>
        `;
    } else {
        buttons = `
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="btnCancelModal" class="btn-ghost">Cancelar</button>
                <button id="btnConfirmDelete" class="btn-primary" style="background: var(--color-red);">Excluir</button>
            </div>
        `;
    }

    modal.innerHTML = content + buttons;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
        overlay.style.animation = 'fadeOut 0.2s ease forwards';
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#btnCancelModal').onclick = close;

    if (isRecurring) {
        overlay.querySelector('#btnOnlyThis').onclick = () => { onConfirm('single'); close(); };
        overlay.querySelector('#btnAllFuture').onclick = () => { onConfirm('all'); close(); };
    } else {
        overlay.querySelector('#btnConfirmDelete').onclick = () => { onConfirm('single'); close(); };
    }
}