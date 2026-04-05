import { invokeSafe } from '../services/api.js';
import { fmtMoney, fmtDate } from '../utils/formatters.js';
import { applyMoneyMask } from '../utils/masks.js';
import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { INVESTMENT_CATEGORIES } from '../config/categories.js';

let currentData = [];
let currentPage = 1;

export async function initInvestments(container, period) {
  const loadData = async (page = 1) => {
    try {
        const res = await invokeSafe('list_investments', { month: period.month, year: period.year, page, page_size: 20 });
        currentData = res.data;
        currentPage = res.page;
        updateCategoryFilter();
        renderTable(currentData);
        renderPagination(res);
    } catch (err) { console.error(err); }
  };

  const updateCategoryFilter = () => {
      const select = document.getElementById('filterInvCat');
      const currentVal = select.value;
      const uniqueCats = [...new Set(currentData.map(item => item.category))].sort();
      select.innerHTML = '<option value="">Todas Categorias</option>' + uniqueCats.map(c => `<option value="${c}">${c}</option>`).join('');
      select.value = currentVal;
  };

  const renderTable = (data) => {
      const tbody = document.getElementById('investmentsTableBody');
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
            <span style="font-size: 0.8rem; color: var(--text-light); text-transform: uppercase;">${r.main_type}</span><br>
            <div style="display: flex; align-items: center; margin-top: 4px;">
                <span style="padding: 4px 8px; background-color: var(--border-color); border-radius: 6px; font-size: 14px;">${r.category}</span>
                ${badge}
            </div>
          </td>
          <td class="value--in">${fmtMoney(r.amount)}</td>
          <td>
            <button class="btn-action" onclick="window.editInvestment(${r.id})">Editar</button>
            <button class="btn-action btn-action--danger" onclick="window.deleteInvestment(${r.id})">Remover</button>
          </td>
        </tr>
      `}).join('');
  };

  const renderPagination = (res) => {
    const container = document.getElementById('paginationInvestments');
    if (res.total_pages <= 1) { container.innerHTML = ''; return; }
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
      <button id="btnNewInv" class="btn btn-primary">Novo Investimento</button>
    </div>

    <div class="filters-bar" style="display: flex; gap: 10px; margin-bottom: 15px; background: var(--bg-card); padding: 10px; border-radius: 8px;">
        <input type="date" id="filterInvDate" class="control-select" style="width: auto;">
        <select id="filterInvCat" class="control-select" style="width: auto;"><option value="">Todas Categorias</option></select>
        <button id="btnFilterInv" class="btn">Filtrar</button>
        <button id="btnClearFilterInv" class="btn">Limpar</button>
    </div>

    <div class="card">
      <table class="data-table">
        <thead><tr><th>Data</th><th>Categoria</th><th>Valor</th><th>Ações</th></tr></thead>
        <tbody id="investmentsTableBody"></tbody>
      </table>
      <div id="paginationInvestments" class="pagination-container"></div>
    </div>

    <div id="modalInvestment" class="modal-overlay hidden">
      <div class="modal-content">
        <h3 id="modalInvTitle" style="margin-top: 0">Adicionar Investimento</h3>
        <form id="formInvestment" data-id="">
          <label class="form-label">Tipo Principal</label>
          <select id="invMainType" class="form-input" required>
            <option value="Renda Fixa">Renda Fixa</option>
            <option value="Renda Variável">Renda Variável</option>
            <option value="Criptomoedas">Criptomoedas</option>
          </select>

          <label class="form-label">Categoria</label>
          <select id="invCategory" class="form-input" required></select>
          <input type="text" id="invCatCustom" class="form-input hidden" placeholder="Especificar..." style="margin-top: 5px;">
          
          <label class="form-label">Valor</label>
          <input type="text" id="invAmount" class="form-input" placeholder="Ex: 500,00" required>
          
          <label class="form-label">Data</label>
          <input type="date" id="invDate" class="form-input" required>

          <div style="margin: 15px 0; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="invRecurring" style="width: 16px; height: 16px;">
            <label for="invRecurring" style="margin:0; font-weight:500; font-size:14px;">Lançamento Fixo (Repetir todo mês)</label>
          </div>

          <div class="modal-actions">
            <button type="button" id="btnCancelInv" class="btn btn-danger">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  applyMoneyMask(document.getElementById('invAmount'));

  window.deleteInvestment = (id) => {
    const item = currentData.find(x => x.id === id);
    if (!item) return;

    showConfirmModal(item, async (mode) => {
        try {
            await invokeSafe('delete_investment', { id, mode });
            showToast('Investimento excluído com sucesso!', 'success');
            loadData(currentPage);
        } catch (err) {
            showToast('Erro ao excluir: ' + err, 'error');
        }
    });
  };

  const mainType = document.getElementById('invMainType');
  const category = document.getElementById('invCategory');
  const catCustom = document.getElementById('invCatCustom');

  const updateCategories = (preSelected = null) => {
    const type = mainType.value;
    category.innerHTML = INVESTMENT_CATEGORIES[type].map(c => `<option value="${c}">${c}</option>`).join('');
    
    if (preSelected && INVESTMENT_CATEGORIES[type].includes(preSelected)) {
        category.value = preSelected;
        catCustom.classList.add('hidden');
    } else if (preSelected) {
        category.value = 'Outros';
        catCustom.value = preSelected;
        catCustom.classList.remove('hidden');
    } else {
        catCustom.classList.add('hidden');
    }
  };

  mainType.addEventListener('change', () => updateCategories());

  category.addEventListener('change', () => {
    if (category.value === 'Outros') { catCustom.classList.remove('hidden'); catCustom.required = true; } 
    else { catCustom.classList.add('hidden'); catCustom.required = false; }
  });

  window.editInvestment = (id) => {
      const item = currentData.find(x => x.id === id);
      if(!item) return;

      document.getElementById('modalInvTitle').textContent = 'Editar Investimento';
      document.getElementById('formInvestment').dataset.id = item.id;

      mainType.value = item.main_type;
      updateCategories(item.category);

      document.getElementById('invAmount').value = item.amount.toFixed(2).replace('.', ',');
      document.getElementById('invDate').value = item.date_iso;
      document.getElementById('invRecurring').checked = !!item.recurring;
      document.getElementById('modalInvestment').classList.remove('hidden');
  };

  document.getElementById('btnFilterInv').onclick = () => {
      const dateVal = document.getElementById('filterInvDate').value;
      const catVal = document.getElementById('filterInvCat').value;
      renderTable(currentData.filter(item => (dateVal ? item.date_iso.startsWith(dateVal) : true) && (catVal ? item.category === catVal : true)));
  };

  document.getElementById('btnClearFilterInv').onclick = () => {
      document.getElementById('filterInvDate').value = '';
      document.getElementById('filterInvCat').value = '';
      renderTable(currentData);
  };

  document.getElementById('btnNewInv').onclick = () => {
    document.getElementById('modalInvTitle').textContent = 'Adicionar Investimento';
    document.getElementById('formInvestment').reset();
    document.getElementById('formInvestment').dataset.id = "";
    updateCategories();
    document.getElementById('invDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalInvestment').classList.remove('hidden');
  };

  document.getElementById('btnCancelInv').onclick = () => document.getElementById('modalInvestment').classList.add('hidden');

  document.getElementById('formInvestment').onsubmit = async (e) => {
    e.preventDefault();
    try {
        const form = e.target;
        const isEdit = form.dataset.id !== "";
        const id = isEdit ? parseInt(form.dataset.id) : null;
        
        const catVal = category.value === 'Outros' ? catCustom.value : category.value;
        const amountStr = document.getElementById('invAmount').value;
        const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
        if(isNaN(amount)) return showToast("Valor inválido!", "error");
        
        const recurring = document.getElementById('invRecurring').checked ? 1 : 0;
        const payload = { main_type: mainType.value, category: catVal, amount: amount, date_iso: document.getElementById('invDate').value, recurring };
        
        if(isEdit) await invokeSafe('update_investment', { id: id, payload: payload });
        else await invokeSafe('add_investment', { payload: payload });
        
        await invokeSafe('generate_recurring', { month: period.month, year: period.year }).catch(() => {});

        showToast(`Investimento ${isEdit ? 'atualizado' : 'salvo'} com sucesso!`, 'success');
        document.getElementById('modalInvestment').classList.add('hidden');
        loadData(currentPage);
    } catch (err) { showToast("Falha ao salvar: " + err, 'error'); }
  };

  loadData();
}