export function showConfirmModal(item, onConfirm) {
    const isRecurring = item.recurring === 1 || item.recurring_source_id !== null;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal-content confirm-modal';
    // Override width for compact confirm dialog
    modal.style.cssText = 'width: 420px; max-width: 92vw;';

    let content = `
        <h3 style="margin:0 0 8px 0">Excluir Lançamento?</h3>
        <p style="margin: 0 0 24px; color: var(--text-light); font-size:0.9rem;">Esta ação não pode ser desfeita.</p>
    `;
    let buttons = '';

    if (isRecurring) {
        content = `
            <h3 style="margin:0 0 8px 0">Excluir Item Recorrente</h3>
            <p style="margin: 0 0 24px; color: var(--text-light); font-size:0.9rem;">Este item faz parte de uma recorrência. Como deseja prosseguir?</p>
        `;
        buttons = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="btnOnlyThis"   class="btn btn-danger">Apenas este mês</button>
                <button id="btnAllFuture"  class="btn btn-primary">Este e todos os futuros</button>
                <button id="btnCancelModal" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
    } else {
        buttons = `
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="btnCancelModal" class="btn btn-secondary">Cancelar</button>
                <button id="btnConfirmDelete" class="btn btn-danger">Excluir</button>
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
        overlay.querySelector('#btnOnlyThis').onclick  = () => { onConfirm('single'); close(); };
        overlay.querySelector('#btnAllFuture').onclick = () => { onConfirm('all');    close(); };
    } else {
        overlay.querySelector('#btnConfirmDelete').onclick = () => { onConfirm('single'); close(); };
    }
}