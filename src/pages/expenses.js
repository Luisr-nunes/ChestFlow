import { invokeSafe, fmtMoney, fmtDate, applyMoneyMask } from '../utils.js';
import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';

const EXPENSE_CATEGORIES = {
  'Fixa': ['Aluguel', 'Energia', 'Água', 'Internet', 'Condomínio', 'Faculdade', 'Seguro', 'Plano de Saúde', 'Academia', 'Anticoncepcional', 'Parcelamento', 'Empréstimo', 'Feira', 'Streaming', 'Cota Trabalho', 'Outros'],
  'Variavel': ['Supermercado', 'Farmácia', 'Restaurante', 'Uber', 'Combustível', 'Lazer', 'Telefone', 'Padaria', 'Alimentação Trabalho', 'Cartão de Crédito', 'PIX', 'Barbeiro', 'Tatuagem', 'Suplementos', 'Medicamentos', 'Outros'],
  'Adicional': ['Presente', 'Viagem', 'Reforma', 'Eletrônicos', 'Vestuário', 'Cinema', 'Bike Itaú', 'Plantas', 'Aquário', 'Perfume', 'Materiais', 'Livros', 'Outros']
};

let currentData = [];
let currentPage = 1;
let totalPages = 1;

export async function initExpenses(container, period) {
  const loadData = async (page = 1) => {
    try {
        const res = await invokeSafe('list_expenses', { month: period.month, year: period.year, page, page_size: 20 });
        currentData = res.data;
        currentPage = res.page;
        totalPages = res.total_pages;
        updateCategoryFilter();
        renderTable(currentData);
        renderPagination(res);
        updateCategoryTotal(); 
    } catch (err) { console.error(err); }
  };

  const updateCategoryFilter = () => {
      const select = document.getElementById('filterExpCat');
      const currentVal = select.value;
      const uniqueCats = [...new Set(currentData.map(item => item.subcategory))].sort();
      select.innerHTML = '<option value="">Todas Categorias</option>' + uniqueCats.map(c => `<option value="${c}">${c}</option>`).join('');
      select.value = currentVal;
  };

  const updateCategoryTotal = async () => {
    const catVal = document.getElementById('filterExpCat').value;
    const banner = document.getElementById('categoryTotalBanner');
    if (!catVal) {
        banner.classList.add('hidden');
        return;
    }
    try {
        const total = await invokeSafe('get_category_total', { month: period.month, year: period.year, subcategory: catVal });
        banner.innerHTML = `<span>Total de <strong>${catVal}</strong> em ${period.month}/${period.year}:</span> <strong>${fmtMoney(total)}</strong>`;
        banner.classList.remove('hidden');
    } catch (err) { console.error(err); }
  };

  const renderTable = (data) => {
      const tbody = document.getElementById('expensesTableBody');
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
        } else if (r.total_installments > 1) {
            badge = `<span class="badge-generated" style="background:rgba(52,152,219,0.1);color:#3498db"># ${r.installment_number}/${r.total_installments}</span>`;
        }

        return `
        <tr>
          <td>${fmtDate(r.date_iso)}</td>
          <td>
            <span style="font-size: 0.8rem; color: var(--text-light); text-transform: uppercase;">${r.main_type}</span><br>
            <div style="display: flex; align-items: center; margin-top: 4px;">
                <span style="padding: 4px 8px; background-color: var(--border-color); border-radius: 6px; font-size: 14px;">${r.subcategory}</span>
                ${badge}
            </div>
          </td>
          <td class="value--out">${fmtMoney(r.amount)}</td>
          <td>
            <button class="btn-action" onclick="window.editExpense(${r.id})">Editar</button>
            <button class="btn-action btn-action--danger" onclick="window.deleteExpense(${r.id})">Remover</button>
          </td>
        </tr>
      `}).join('');
  };

  const renderPagination = (res) => {
    const container = document.getElementById('paginationExpenses');
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
      <h3>Despesas</h3>
      <button id="btnNewExp" class="btn btn-primary">Nova Despesa</button>
    </div>

    <div class="filters-bar" style="display: flex; gap: 10px; margin-bottom: 15px; background: var(--bg-card); padding: 10px; border-radius: 8px;">
        <input type="date" id="filterExpDate" class="control-select" style="width: auto;">
        <select id="filterExpCat" class="control-select" style="width: auto;"><option value="">Todas Categorias</option></select>
        <button id="btnFilterExp" class="btn">Filtrar</button>
        <button id="btnClearFilterExp" class="btn">Limpar</button>
    </div>

    <div id="categoryTotalBanner" class="hidden"></div>

    <div class="card">
      <table class="data-table">
        <thead><tr><th>Data</th><th>Categoria</th><th>Valor</th><th>Ações</th></tr></thead>
        <tbody id="expensesTableBody"></tbody>
      </table>
      <div id="paginationExpenses" class="pagination-container"></div>
    </div>

    <div id="modalExpense" class="modal-overlay hidden">
      <div class="modal-content">
        <h3 id="modalExpTitle" style="margin-top: 0">Adicionar Despesa</h3>
        <form id="formExpense" data-id="">
          <label class="form-label">Tipo Principal</label>
          <select id="expMainType" class="form-input" required>
            <option value="Fixa">Fixa</option>
            <option value="Variavel">Variável</option>
            <option value="Adicional">Adicional</option>
          </select>

          <label class="form-label">Subcategoria</label>
          <select id="expSubcategory" class="form-input" required></select>
          <input type="text" id="expSubCustom" class="form-input hidden" placeholder="Especificar nova subcategoria..." style="margin-top: 5px;">
          
          <label class="form-label">Valor Total</label>
          <input type="text" id="expAmount" class="form-input" placeholder="Ex: 150,50" required>
          
          <label class="form-label">Data</label>
          <input type="date" id="expDate" class="form-input" required>

          <div id="recurringSection" style="margin: 15px 0; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="expRecurring" style="width: 16px; height: 16px;">
            <label for="expRecurring" style="margin:0; font-weight:500; font-size:14px;">Lançamento Fixo (Repetir todo mês)</label>
          </div>

          <div id="installmentsSection" style="margin: 15px 0; display: flex; align-items: center; gap: 15px;">
            <label class="form-label" style="margin:0">Parcelas:</label>
            <input type="number" id="expInstallments" class="form-input" value="1" min="1" max="120" style="width: 80px;">
            <span id="instHint" style="font-size:12px; color:var(--text-light)">Lançamento único</span>
          </div>

          <div class="modal-actions">
            <button type="button" id="btnCancelExp" class="btn">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  applyMoneyMask(document.getElementById('expAmount'));

  const instInput = document.getElementById('expInstallments');
  const instHint = document.getElementById('instHint');
  const recCheck = document.getElementById('expRecurring');

  instInput.oninput = () => {
      const v = parseInt(instInput.value) || 1;
      instHint.textContent = v > 1 ? `Criará ${v} lançamentos mensais` : 'Lançamento único';
      if (v > 1) { recCheck.checked = false; document.getElementById('recurringSection').style.opacity = '0.5'; }
      else { document.getElementById('recurringSection').style.opacity = '1'; }
  };

  recCheck.onchange = () => {
      if (recCheck.checked) { instInput.value = 1; instHint.textContent = 'Lançamento único'; document.getElementById('installmentsSection').style.opacity = '0.5'; }
      else { document.getElementById('installmentsSection').style.opacity = '1'; }
  };

  window.deleteExpense = (id) => {
    const item = currentData.find(x => x.id === id);
    if (!item) return;

    showConfirmModal(item, async (mode) => {
        try {
            await invokeSafe('delete_expense', { id, mode });
            showToast('Despesa excluída com sucesso!', 'success');
            loadData(currentPage);
        } catch (err) { showToast('Erro ao excluir: ' + err, 'error'); }
    });
  };

  const mainType = document.getElementById('expMainType');
  const subCategory = document.getElementById('expSubcategory');
  const subCustom = document.getElementById('expSubCustom');

  const updateSubcategories = (preSelected = null) => {
    const type = mainType.value;
    subCategory.innerHTML = EXPENSE_CATEGORIES[type].map(c => `<option value="${c}">${c}</option>`).join('');
    if (preSelected && EXPENSE_CATEGORIES[type].includes(preSelected)) { subCategory.value = preSelected; subCustom.classList.add('hidden'); }
    else if (preSelected) { subCategory.value = 'Outros'; subCustom.value = preSelected; subCustom.classList.remove('hidden'); }
    else { subCustom.classList.add('hidden'); }
  };

  mainType.addEventListener('change', () => updateSubcategories());
  subCategory.addEventListener('change', () => {
    if (subCategory.value === 'Outros') { subCustom.classList.remove('hidden'); subCustom.required = true; } 
    else { subCustom.classList.add('hidden'); subCustom.required = false; }
  });

  window.editExpense = (id) => {
      const item = currentData.find(x => x.id === id);
      if(!item) return;
      document.getElementById('modalExpTitle').textContent = 'Editar Despesa';
      document.getElementById('formExpense').dataset.id = item.id;
      mainType.value = item.main_type;
      updateSubcategories(item.subcategory);
      document.getElementById('expAmount').value = item.amount.toFixed(2).replace('.', ',');
      document.getElementById('expDate').value = item.date_iso;
      document.getElementById('expRecurring').checked = !!item.recurring;
      document.getElementById('expInstallments').value = 1;
      document.getElementById('installmentsSection').classList.add('hidden'); 
      document.getElementById('modalExpense').classList.remove('hidden');
  };

  document.getElementById('btnFilterExp').onclick = () => {
      const dateVal = document.getElementById('filterExpDate').value;
      const catVal = document.getElementById('filterExpCat').value;
      updateCategoryTotal();
      const filtered = currentData.filter(item => (dateVal ? item.date_iso.startsWith(dateVal) : true) && (catVal ? item.subcategory === catVal : true));
      renderTable(filtered);
  };

  document.getElementById('btnClearFilterExp').onclick = () => {
      document.getElementById('filterExpDate').value = '';
      document.getElementById('filterExpCat').value = '';
      updateCategoryTotal();
      renderTable(currentData);
  };

  document.getElementById('btnNewExp').onclick = () => {
    document.getElementById('modalExpTitle').textContent = 'Adicionar Despesa';
    document.getElementById('formExpense').reset();
    document.getElementById('formExpense').dataset.id = "";
    document.getElementById('installmentsSection').classList.remove('hidden');
    updateSubcategories();
    document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalExpense').classList.remove('hidden');
  };

  document.getElementById('btnCancelExp').onclick = () => document.getElementById('modalExpense').classList.add('hidden');

  document.getElementById('formExpense').onsubmit = async (e) => {
    e.preventDefault();
    try {
        const form = e.target;
        const isEdit = form.dataset.id !== "";
        const id = isEdit ? parseInt(form.dataset.id) : null;
        const subCatVal = subCategory.value === 'Outros' ? subCustom.value : subCategory.value;
        const amountStr = document.getElementById('expAmount').value;
        const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
        if(isNaN(amount)) return showToast("Valor inválido!", "error");
        
        const recurring = document.getElementById('expRecurring').checked ? 1 : 0;
        const installments = parseInt(document.getElementById('expInstallments').value) || 1;
        
        const payload = { 
            main_type: mainType.value, subcategory: subCatVal, amount: amount, 
            date_iso: document.getElementById('expDate').value, recurring,
            total_installments: installments > 1 ? installments : null
        };
        
        if(isEdit) await invokeSafe('update_expense', { id: id, payload: payload });
        else await invokeSafe('add_expense', { payload: payload });
        
        showToast(`Despesa ${isEdit ? 'atualizada' : 'salva'} com sucesso!`, 'success');
        document.getElementById('modalExpense').classList.add('hidden');
        loadData(currentPage);
    } catch(err) { showToast("Falha ao salvar: " + err, 'error'); }
  };

  loadData();
}