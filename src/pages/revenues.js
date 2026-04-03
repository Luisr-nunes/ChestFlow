import { invokeSafe, fmtMoney, fmtDate, applyMoneyMask } from '../utils.js';
import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';

const REVENUE_CATEGORIES = ['Salário', 'Aluguel', 'Dividendos', 'JCP', 'Venda de Ativo', 'Freelance', 'Reembolso', 'Presente', 'Outros'];
let currentData = [];
let currentPage = 1;

export async function initRevenues(container, period) {
  const loadData = async (page = 1) => {
    try {
        const res = await invokeSafe('list_revenues', { month: period.month, year: period.year, page, page_size: 20 });
        currentData = res.data;
        currentPage = res.page;
        updateCategoryFilter();
        renderTable(currentData);
        renderPagination(res);
    } catch (err) { console.error(err); }
  };

  const updateCategoryFilter = () => {
      const select = document.getElementById('filterRevCat');
      const currentVal = select.value;
      const uniqueCats = [...new Set(currentData.map(item => item.type))].sort();
      select.innerHTML = '<option value="">Todas Categorias</option>' + uniqueCats.map(c => `<option value="${c}">${c}</option>`).join('');
      select.value = currentVal;
  };

  const renderTable = (data) => {
      const tbody = document.getElementById('revenuesTableBody');
      if (data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-light);">Nenhum registro.</td></tr>';
          return;
      }
      tbody.innerHTML = data.map(r => {
        let badge = '';
        if (r.recurring === 1) {
            badge = `<span class="badge-recurring">↻ recorrente</span>`;
        } else if (r.recurring_source_id) {
            badge = `<span class="badge-generated" title="Gerado automaticamente">↻</span>`;
        }

        return `
        <tr>
          <td>${fmtDate(r.date_iso)}</td>
          <td>
            <div style="display: flex; align-items: center;">
                <span style="padding: 4px 8px; background-color: var(--border-color); border-radius: 6px; font-size: 14px;">${r.type}</span>
                ${badge}
            </div>
          </td>
          <td class="value--in">${fmtMoney(r.amount)}</td>
          <td>
            <button class="btn-action" onclick="window.editRevenue(${r.id})">Editar</button>
            <button class="btn-action btn-action--danger" onclick="window.deleteRevenue(${r.id})">Remover</button>
          </td>
        </tr>
      `}).join('');
  };

  const renderPagination = (res) => {
    const container = document.getElementById('paginationRevenues');
    if (res.total_pages <= 1) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = `
        <button class="pagination-btn" id="prevPage" ${res.page === 1 ? 'disabled' : ''}>← Anterior</button>
        <span style="font-size: 14px; color: var(--text-light);">Página ${res.page} de ${res.total_pages}</span>
        <button class="pagination-btn" id="nextPage" ${res.page === res.total_pages ? 'disabled' : ''}>Próxima →</button>
    `;
    document.getElementById('prevPage').onclick = () => loadData(res.page - 1);
    document.getElementById('nextPage').onclick = () => loadData(res.page + 1);
  };

  container.innerHTML = `
    <div class="page-header">
      <h3>Receitas</h3>
      <button id="btnNewRev" class="btn btn-primary">Nova Receita</button>
    </div>
    
    <div class="filters-bar" style="display: flex; gap: 10px; margin-bottom: 15px; background: var(--bg-card); padding: 10px; border-radius: 8px;">
        <input type="date" id="filterRevDate" class="control-select" style="width: auto;">
        <select id="filterRevCat" class="control-select" style="width: auto;"><option value="">Todas Categorias</option></select>
        <button id="btnFilterRev" class="btn">Filtrar</button>
        <button id="btnClearFilterRev" class="btn">Limpar</button>
    </div>

    <div class="card">
      <table class="data-table">
        <thead><tr><th>Data</th><th>Origem</th><th>Valor</th><th>Ações</th></tr></thead>
        <tbody id="revenuesTableBody"></tbody>
      </table>
      <div id="paginationRevenues" class="pagination-container"></div>
    </div>

    <div id="modalRevenue" class="modal-overlay hidden">
      <div class="modal-content">
        <h3 id="modalRevTitle" style="margin-top: 0">Adicionar Receita</h3>
        <form id="formRevenue" data-id="">
          <label class="form-label">Origem</label>
          <select id="revType" class="form-input" required>
            ${REVENUE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <input type="text" id="revTypeCustom" class="form-input hidden" placeholder="Especificar nova origem..." style="margin-top: 5px;">
          
          <label class="form-label">Valor</label>
          <input type="text" id="revAmount" class="form-input" placeholder="Ex: 1500,00" required>
          <label class="form-label">Data</label>
          <input type="date" id="revDate" class="form-input" required>
          
          <div style="margin: 15px 0; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="revRecurring" style="width: 16px; height: 16px;">
            <label for="revRecurring" style="margin:0; font-weight:500; font-size:14px;">Lançamento Fixo (Repetir todo mês)</label>
          </div>
          
          <div class="modal-actions">
            <button type="button" id="btnCancelRev" class="btn">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  applyMoneyMask(document.getElementById('revAmount'));

  window.deleteRevenue = (id) => {
    const item = currentData.find(x => x.id === id);
    if (!item) return;

    showConfirmModal(item, async (mode) => {
        try {
            await invokeSafe('delete_revenue', { id, mode });
            showToast('Receita excluída com sucesso!', 'success');
            loadData(currentPage);
        } catch (err) {
            showToast('Erro ao excluir: ' + err, 'error');
        }
    });
  };

  window.editRevenue = (id) => {
      const item = currentData.find(x => x.id === id);
      if(!item) return;
      
      document.getElementById('modalRevTitle').textContent = 'Editar Receita';
      document.getElementById('formRevenue').dataset.id = item.id;
      
      const revType = document.getElementById('revType');
      const revTypeCustom = document.getElementById('revTypeCustom');
      
      if(REVENUE_CATEGORIES.includes(item.tipo)) {
          revType.value = item.tipo;
          revTypeCustom.classList.add('hidden');
      } else {
          revType.value = 'Outros';
          revTypeCustom.value = item.tipo;
          revTypeCustom.classList.remove('hidden');
      }
      
      document.getElementById('revAmount').value = item.amount.toFixed(2).replace('.', ',');
      document.getElementById('revDate').value = item.date_iso;
      document.getElementById('revRecurring').checked = !!item.recurring;
      document.getElementById('modalRevenue').classList.remove('hidden');
  };

  document.getElementById('btnFilterRev').onclick = () => {
      const dateVal = document.getElementById('filterRevDate').value;
      const catVal = document.getElementById('filterRevCat').value;
      renderTable(currentData.filter(item => (dateVal ? item.date_iso.startsWith(dateVal) : true) && (catVal ? item.type === catVal : true)));
  };

  document.getElementById('btnClearFilterRev').onclick = () => {
      document.getElementById('filterRevDate').value = '';
      document.getElementById('filterRevCat').value = '';
      renderTable(currentData);
  };

  const modal = document.getElementById('modalRevenue');
  const revType = document.getElementById('revType');
  const revTypeCustom = document.getElementById('revTypeCustom');

  revType.addEventListener('change', () => {
    if (revType.value === 'Outros') { revTypeCustom.classList.remove('hidden'); revTypeCustom.required = true; } 
    else { revTypeCustom.classList.add('hidden'); revTypeCustom.required = false; }
  });

  document.getElementById('btnNewRev').onclick = () => {
    document.getElementById('modalRevTitle').textContent = 'Adicionar Receita';
    document.getElementById('formRevenue').reset();
    document.getElementById('formRevenue').dataset.id = "";
    document.getElementById('revDate').value = new Date().toISOString().split('T')[0];
    revTypeCustom.classList.add('hidden');
    modal.classList.remove('hidden');
  };

  document.getElementById('btnCancelRev').onclick = () => modal.classList.add('hidden');

  document.getElementById('formRevenue').onsubmit = async (e) => {
    e.preventDefault();
    try {
        const form = e.target;
        const isEdit = form.dataset.id !== "";
        const id = isEdit ? parseInt(form.dataset.id) : null;
        
        const typeVal = revType.value === 'Outros' ? revTypeCustom.value : revType.value;
        const amountStr = document.getElementById('revAmount').value;
        const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
        if(isNaN(amount)) return showToast("Valor inválido!", "error");

        const isRec = document.getElementById('revRecurring').checked ? 1 : 0;
        const payload = { 
            type: typeVal, 
            amount: amount, 
            date_iso: document.getElementById('revDate').value, 
            recurring: isRec 
        };
        
        if(isEdit) await invokeSafe('update_revenue', { id: id, payload: payload });
        else await invokeSafe('add_revenue', { payload: payload });
        
        // Dispara geração imediata para o período atual (caso seja recorrente)
        await invokeSafe('generate_recurring', { month: period.month, year: period.year }).catch(() => {});

        showToast(`Receita ${isEdit ? 'atualizada' : 'salva'} com sucesso!`, 'success');
        modal.classList.add('hidden');
        loadData(currentPage);
    } catch (err) { showToast("Falha ao salvar: " + err, 'error'); }
  };

  loadData();
}