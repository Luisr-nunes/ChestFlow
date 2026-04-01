document.addEventListener("DOMContentLoaded", () => {
  let selectedMonth = new Date().getMonth() + 1;
  let selectedYear = new Date().getFullYear();

  const EXPENSE_CATEGORIES = { 
    'Fixa': [
      'Aluguel', 'Energia', 'Água', 'Internet', 'Condomínio', 'Faculdade', 'Seguro',
      'Plano de Saúde', 'Academia', 'Anticoncepcional', 
      'Parcelamento', 'Empréstimo', 
      'Feira', 'Streaming', 'Cota Trabalho'
    ], 
    'Variavel': [
      'Supermercado', 'Farmácia', 'Restaurante', 'Uber', 'Combustível', 'Lazer',
      'Telefone', 'Padaria', 'Alimentação Trabalho',
      'Cartão de Crédito', 'PIX',
      'Barbeiro', 'Tatuagem',
      'Suplementos', 'Medicamentos'
    ], 
    'Adicional': [
      'Presente', 'Viagem', 'Reforma', 'Eletrônicos', 'Vestuário',
      'Cinema', 'Bike Itaú', 
      'Plantas', 'Aquário', 'Perfume',
      'Materiais', 'Livros'
    ] 
  };

  
  const INVESTMENT_CATEGORIES = { 
    'Renda Fixa': ['CDB', 'Tesouro Direto', 'LCI', 'LCA', 'CRI', 'CRA', 'Debêntures'], 
    'Renda Variável': ['Ações', 'FIIs', 'FIA', 'ETFs', 'BDRs', 'Opções', 'Futuros', 'Câmbio', 'Commodities'], 
    'Criptomoedas': ['Bitcoin', 'Ethereum', 'Solana', 'USDT', 'Dogecoin', 'Cardano'] 
  };
  
  const REVENUE_CATEGORIES = ['Salário', 'Aluguel', 'Dividendos', 'JCP', 'Venda de Ativo', 'Freelance', 'Reembolso', 'Presente'];

  const fmtMoney = (v) => {
    return Number(v || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const fmtDate = (iso) => { 
    try { 
      if(!iso) return '-'; 
      const d = new Date(iso); 
      return d.toLocaleDateString('pt-BR', {timeZone: 'UTC'}); 
    } catch { return iso; } 
  };

  let monthlyHistoryChart, expensePieChart, revenuePieChart;


function initCharts() {
    const style = getComputedStyle(document.body);
    const colorText = style.getPropertyValue('--text-main');
    const gridColor = style.getPropertyValue('--border-color');
    const cardBg = style.getPropertyValue('--bg-card');

    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%', 
      layout: {
        padding: 10 
      },
      plugins: {
        legend: {
          position: 'bottom', 
          labels: { 
            color: colorText, 
            usePointStyle: true,
            padding: 15, 
            boxWidth: 8,
            font: { family: "'Poppins', sans-serif", size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
               
              let label = context.label || '';
              if (label) label += ': ';
              if (context.parsed !== null) {
                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
              }
              return label;
            }
          }
        }
      }
    };


    const ctxHist = document.getElementById('monthlyHistoryChart')?.getContext('2d');
    if(ctxHist) {
      if(monthlyHistoryChart) monthlyHistoryChart.destroy();
      monthlyHistoryChart = new Chart(ctxHist, {
        type: 'bar',
        data: { labels: [], datasets: [ 
          { label: 'Receita', data: [], backgroundColor: '#2ecc71', borderRadius: 4, barPercentage: 0.6 }, 
          { label: 'Saídas', data: [], backgroundColor: '#e74c3c', borderRadius: 4, barPercentage: 0.6 } 
        ]},
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          layout: {
             padding: { left: 10, right: 10, top: 0, bottom: 30 }
          },
          scales: { 
            x: { 
              grid: { display: false }, 
              ticks: { 
                color: colorText,
                font: { size: 11 },
                padding: 10, 
                autoSkip: false,
                maxRotation: 0  
              } 
            }, 
            y: { 
              grid: { color: gridColor, borderDash: [4, 4] }, 
              ticks: { color: colorText, beginAtZero: true } 
            } 
          }, 
          plugins: { 
            legend: { 
              labels: { color: colorText, usePointStyle: true, boxWidth: 8 } 
            } 
          } 
        }
      });
    }

    const ctxPieExp = document.getElementById('expensePieChart')?.getContext('2d');
    if(ctxPieExp) {
      if(expensePieChart) expensePieChart.destroy();
      expensePieChart = new Chart(ctxPieExp, {
        type: 'doughnut',
        data: {
          labels: ['Fixas', 'Variáveis', 'Adicionais'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#e74c3c', '#e67e22', '#f1c40f'],
            borderColor: cardBg,
            borderWidth: 2,
          }]
        },
        options: doughnutOptions
      });
    }

    const ctxPieRev = document.getElementById('revenuePieChart')?.getContext('2d');
    if(ctxPieRev) {
      if(revenuePieChart) revenuePieChart.destroy();
      revenuePieChart = new Chart(ctxPieRev, {
        type: 'doughnut',
        data: {
          labels: ['Salário', 'Investimentos', 'Outros'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#2ecc71', '#3498db', '#9b59b6'],
            borderColor: cardBg,
            borderWidth: 2,
          }]
        },
        options: doughnutOptions
      });
    }
  }

const getChartColors = (count) => {
    const paleta = [
      '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f', 
      '#e67e22', '#1abc9c', '#34495eff', '#95a5a6', '#d35400'
    ];

    return Array(count).fill().map((_, i) => paleta[i % paleta.length]);
  };

  async function updateDashboard() {
    try {
      const res = await window.api.getSummary({ month: selectedMonth, year: selectedYear });
      const setTxt = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = fmtMoney(v); };
      
      setTxt('dashboardReceita', res.totalReceita);
      setTxt('dashboardDespesas', res.totalDespesa);
      setTxt('dashboardInvestimentos', res.totalInvestimento);
      
      const saldoCalculado = (res.totalReceita || 0) - (res.totalDespesa || 0) - (res.totalInvestimento || 0);
      setTxt('dashboardSaldo', saldoCalculado.toFixed(2));

      const safe = await window.api.getSafeToSpend({ month: selectedMonth, year: selectedYear });
      setTxt('safeToSpendValue', safe.safeToSpend);

      if(expensePieChart) {
        const fixas = res.despesasFixas || 0;
        const variaveis = res.despesasVariaveis || 0;
        const adicionais = res.despesasAdicionais || 0;
        expensePieChart.data.datasets[0].data = [fixas, variaveis, adicionais];
        expensePieChart.update();
      }

      if(revenuePieChart) {
         const detailed = await window.api.getExpensesBySubcategory({ month: selectedMonth, year: selectedYear });
         
         let labels = [];
         let data = [];
         
         if (detailed.length > 0) {
  
            const top8 = detailed.slice(0, 8);
            
            const outros = detailed.slice(8).reduce((acc, curr) => acc + (curr.total || 0), 0);

            labels = top8.map(d => d.subcategoria);
            data = top8.map(d => d.total);

            if (outros > 0) {
              labels.push('Outros');
              data.push(outros);
            }
         } else {
            labels = ['Sem dados'];
            data = [0]; 
         }

         revenuePieChart.data.labels = labels;
         revenuePieChart.data.datasets[0].data = data;
         
         
         const backgroundColors = labels.map(label => {
            if (label === 'Outros') return '#95a5a6';
            if (label === 'Sem dados') return '#e2e8f0';
            
            return getCategoryConfig(label).color;
         });

         revenuePieChart.data.datasets[0].backgroundColor = backgroundColors;
         revenuePieChart.data.datasets[0].hoverBackgroundColor = backgroundColors; 
         
         
         revenuePieChart.update();
      }
      

      const history = await window.api.getMonthlyHistory();
      if(monthlyHistoryChart && history.length) {
        const labels = { '01':'Jan', '02':'Fev', '03':'Mar', '04':'Abr', '05':'Mai', '06':'Jun', '07':'Jul', '08':'Ago', '09':'Set', '10':'Out', '11':'Nov', '12':'Dez' };
        monthlyHistoryChart.data.labels = history.map(h => labels[h.mes]);
        monthlyHistoryChart.data.datasets[0].data = history.map(h => h.receita);
        monthlyHistoryChart.data.datasets[1].data = history.map(h => h.despesa);
        monthlyHistoryChart.update();
      }

      
      const recents = await window.api.getRecentTransactions({ month: selectedMonth, year: selectedYear });
      const recentList = document.getElementById('recentTransactionsList');
      if(recentList) {
        if(!recents.length) recentList.innerHTML = `<p class="no-data">Sem dados.</p>`;
        else {
          recentList.innerHTML = recents.map(t => {
            const isRec = t.tipo === 'Receita';
            const valueClass = isRec ? 'value--in' : 'value--out';
            return `<div class="recent-transaction">
                      <div>
                        <p class="recent-transaction__desc">${t.descricao || t.tipo}</p>
                        <p class="recent-transaction__date">${fmtDate(t.data_iso)}</p>
                      </div>
                      <span class="recent-transaction__value ${valueClass}">${isRec ? '+' : '-'} ${fmtMoney(t.valor)}</span>
                    </div>`;
          }).join('');
        }
      }
    } catch (e) { console.error(e); }
  }

  

  window.showModal = (mode, editData = null) => {
    const d = editData || {};
    const form = document.getElementById('modalFields');
    const inputClass = "form-input";
    document.getElementById('modalTitle').textContent = editData ? 'Editar' : 'Novo';
    document.getElementById('modalForm').dataset.mode = mode;
    document.getElementById('modalForm').dataset.id = d.id || '';

    let html = '';
    if (mode === 'expense' || mode === 'investment') { 
        const source = mode === 'expense' ? EXPENSE_CATEGORIES : INVESTMENT_CATEGORIES;
        html += `<label class="form-label">Tipo</label><select id="f_tipo" class="${inputClass}" onchange="window.updateSub()">${Object.keys(source).map(k => `<option value="${k}">${k}</option>`).join('')}</select>`;
        html += `<label class="form-label">Subcategoria</label><select id="f_sub_select" class="${inputClass}" onchange="window.checkCustom()"></select>`;
        html += `<input id="f_sub_custom" type="text" class="${inputClass} hidden" placeholder="Especificar...">`;
    } else {
        html += `<label class="form-label">Origem</label><select id="f_tipo" class="${inputClass}" onchange="window.checkCustomForRev()">${REVENUE_CATEGORIES.map(k => `<option value="${k}">${k}</option>`).join('')}<option value="Outros">Outros...</option></select>`;
        html += `<input id="f_sub_custom" type="text" class="${inputClass} hidden" placeholder="Especificar...">`;
    }
    html += `<div><label class="form-label">Valor</label><input id="f_valor" type="text" class="${inputClass}" placeholder="Ex: 123,45"></div>`;
    html += `<div><label class="form-label">Data</label><input id="f_data" type="date" class="${inputClass}"></div>`;
    html += `<div class="form-check"><input id="f_rec" type="checkbox"><label>Recorrente</label></div>`;
    
    form.innerHTML = html;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('f_data').value = d.data_iso || new Date().toISOString().split('T')[0];
    document.getElementById('f_valor').value = d.valor || '';
    if(d.recorrente) document.getElementById('f_rec').checked = true;

    if(mode !== 'revenue') {
        if(d.tipo_principal) document.getElementById('f_tipo').value = d.tipo_principal;
        window.updateSub(mode === 'expense' ? d.subcategoria : d.categoria);
    } else {
        if(d.tipo && REVENUE_CATEGORIES.includes(d.tipo)) document.getElementById('f_tipo').value = d.tipo;
        else if(d.tipo) { document.getElementById('f_tipo').value = 'Outros'; window.checkCustomForRev(); document.getElementById('f_sub_custom').value = d.tipo; }
    }
  };

  window.updateSub = (pre) => {
    const mode = document.getElementById('modalForm').dataset.mode;
    const source = mode === 'expense' ? EXPENSE_CATEGORIES : INVESTMENT_CATEGORIES;
    const type = document.getElementById('f_tipo').value;
    const subSelect = document.getElementById('f_sub_select');
    subSelect.innerHTML = (source[type] || []).map(o => `<option value="${o}">${o}</option>`).join('') + `<option value="Outros">Outros...</option>`;
    if(pre && (source[type]||[]).includes(pre)) subSelect.value = pre;
    else if(pre) { subSelect.value = 'Outros'; window.checkCustom(); document.getElementById('f_sub_custom').value = pre; }
  };
  window.checkCustom = () => { document.getElementById('f_sub_custom').classList.toggle('hidden', document.getElementById('f_sub_select').value === 'Outros'); };
  window.checkCustomForRev = () => { document.getElementById('f_sub_custom').classList.toggle('hidden', document.getElementById('f_tipo').value === 'Outros'); };

  document.getElementById('modalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { mode, id } = e.target.dataset;
    const valor = parseFloat(document.getElementById('f_valor').value.replace(',', '.'));
    const data_iso = document.getElementById('f_data').value;
    const recorrente = document.getElementById('f_rec').checked;
    if(!valor) return alert("Valor inválido");

    let payload = { valor, data_iso, recorrente };
    if(mode === 'revenue') {
        const sel = document.getElementById('f_tipo').value;
        payload.tipo = sel === 'Outros' ? document.getElementById('f_sub_custom').value : sel;
    } else {
        payload.tipo_principal = document.getElementById('f_tipo').value;
        const subSel = document.getElementById('f_sub_select').value;
        const finalSub = subSel === 'Outros' ? document.getElementById('f_sub_custom').value : subSel;
        if(mode === 'expense') payload.subcategoria = finalSub; else payload.categoria = finalSub;
    }
    
    const apiFunc = mode === 'revenue' ? (id ? 'updateRevenue' : 'addRevenue') : (mode === 'expense' ? (id ? 'updateExpense' : 'addExpense') : (id ? 'updateInvestment' : 'addInvestment'));
    if(id) payload.id = id;
    await window.api[apiFunc](payload);
    document.getElementById('modalOverlay').classList.add('hidden');
    document.dispatchEvent(new CustomEvent('transaction-updated', { detail: { data_iso } }));
  });

  document.getElementById('modalCancel').addEventListener('click', () => document.getElementById('modalOverlay').classList.add('hidden'));

 
  let currentListData = []; 

  
  async function loadList(page) {
    const tbody = document.getElementById(page + 'TableBody');
    if(!tbody) return;

    
    
    if(page === 'receitas') currentListData = await window.api.listRevenues({ month: selectedMonth, year: selectedYear });
    if(page === 'despesas') currentListData = await window.api.listExpenses({ month: selectedMonth, year: selectedYear });
    if(page === 'investimentos') currentListData = await window.api.listInvestments({ month: selectedMonth, year: selectedYear });

    
    populateFilterCategories(page, currentListData);

    
    renderTable(page, currentListData);
  }

  
  function populateFilterCategories(page, data) {
      let selectId = '';
      if(page === 'receitas') selectId = 'filterRevCat';
      if(page === 'despesas') selectId = 'filterExpCat';
      if(page === 'investimentos') selectId = 'filterInvCat';
      
      const select = document.getElementById(selectId);
      if(!select) return;

      const currentVal = select.value;

      const uniqueCats = new Set();
      data.forEach(item => {
          if(page === 'receitas') uniqueCats.add(item.tipo);
          else if(page === 'despesas') uniqueCats.add(item.subcategoria);
          else uniqueCats.add(item.categoria);
      });

      
      const optionsHtml = Array.from(uniqueCats)
        .sort()
        .map(c => `<option value="${c}">${c}</option>`)
        .join('');

      select.innerHTML = '<option value="">Todas Categorias</option>' + optionsHtml;
      
      
      if(currentVal && uniqueCats.has(currentVal)) {
          select.value = currentVal;
      }
  }

  
  function renderTable(page, data) {
    const tbody = document.getElementById(page + 'TableBody');
    if(!tbody) return;
    
    if(data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-light);">Nenhum registro encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(i => {
        
        let displayCat = '';
        if(page === 'receitas') displayCat = i.tipo;
        else if(page === 'despesas') displayCat = i.subcategoria;
        else displayCat = i.categoria;

        
        let catHtml = displayCat;
        if (typeof renderCategoryBadge === 'function') {
             catHtml = renderCategoryBadge(displayCat);
        }

        return `<tr class="data-table__row">
                  <td class="data-table__cell">${fmtDate(i.data_iso)}</td>
                  <td class="data-table__cell">${catHtml}</td>
                  <td class="data-table__cell value">${fmtMoney(i.valor)}</td>
                  <td class="data-table__cell actions">
                    <button onclick='window.editItem("${page === 'receitas' ? 'revenue' : (page === 'despesas' ? 'expense' : 'investment')}", ${i.id})' class="btn-action">Editar</button>
                    <button onclick='window.deleteItem("${page === 'receitas' ? 'revenue' : (page === 'despesas' ? 'expense' : 'investment')}", ${i.id})' class="btn-action btn-action--danger">Excluir</button>
                  </td>
                </tr>`;
    }).join('');
  }

  
  window.applyFilters = (page) => {
      let dateVal, catVal;

      
      if(page === 'receitas') {
          dateVal = document.getElementById('filterRevDate').value;
          catVal = document.getElementById('filterRevCat').value;
      } else if(page === 'despesas') {
          dateVal = document.getElementById('filterExpDate').value;
          catVal = document.getElementById('filterExpCat').value;
      } else {
          dateVal = document.getElementById('filterInvDate').value;
          catVal = document.getElementById('filterInvCat').value;
      }

      
      const filtered = currentListData.filter(item => {
          
          const matchDate = dateVal ? (item.data_iso && item.data_iso.startsWith(dateVal)) : true;
          
          let matchCat = true;
          if(catVal) {
              if(page === 'receitas') matchCat = item.tipo === catVal;
              else if(page === 'despesas') matchCat = item.subcategoria === catVal;
              else matchCat = item.categoria === catVal;
          }

          return matchDate && matchCat;
      });

      renderTable(page, filtered);
  };

  window.clearFilters = (page) => {
      
      if(page === 'receitas') {
          document.getElementById('filterRevDate').value = '';
          document.getElementById('filterRevCat').value = '';
      } else if(page === 'despesas') {
          document.getElementById('filterExpDate').value = '';
          document.getElementById('filterExpCat').value = '';
      } else {
          document.getElementById('filterInvDate').value = '';
          document.getElementById('filterInvCat').value = '';
      }
      
      
      renderTable(page, currentListData);
  };

  
  window.editItem = async (mode, id) => {
    
    const item = currentListData.find(x => x.id === id);
    if(item) window.showModal(mode, item);
  };

  window.deleteItem = async (mode, id) => {
    if(!confirm("Excluir?")) return;
    const func = mode === 'revenue' ? 'deleteRevenue' : (mode === 'expense' ? 'deleteExpense' : 'deleteInvestment');
    await window.api[func](id);
    document.dispatchEvent(new CustomEvent('transaction-updated', { detail: {} }));
  };

  
  document.addEventListener('transaction-updated', (e) => {
    const { data_iso } = e.detail;
    if (data_iso) {
      const newDate = new Date(data_iso);
      selectedMonth = newDate.getUTCMonth() + 1;
      selectedYear = newDate.getUTCFullYear();
      document.getElementById('monthSelector').value = selectedMonth;
      document.getElementById('yearSelector').value = selectedYear;
    }
    reloadAll();
  });

  const reloadAll = () => { 
      updateDashboard(); 
      const page = document.querySelector('.page:not(.hidden)')?.id; 
      if(page && page !== 'dashboard' && page !== 'relatorios') loadList(page); 
  };
  
  
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => { 
      
      document.querySelectorAll('.page').forEach(p => p.classList.add('hidden')); 
      
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      
      
      const targetId = btn.dataset.page;
      document.getElementById(targetId).classList.remove('hidden'); 
      btn.classList.add('active');

      if(targetId === 'dashboard') updateDashboard();
      else if(targetId !== 'relatorios') loadList(targetId);
  }));

  
  document.getElementById('monthSelector').addEventListener('change', (e) => { selectedMonth = +e.target.value; reloadAll(); });
  document.getElementById('yearSelector').addEventListener('change', (e) => { selectedYear = +e.target.value; reloadAll(); });
  
  
  const download = (content, name, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], {type})); a.download = name; a.click(); };
  document.getElementById('btnExportCSV')?.addEventListener('click', async () => {
    const d = await window.api.getAllData({ month: selectedMonth, year: selectedYear });
    let csv = "TIPO,DATA,CATEGORIA,VALOR\n";
    d.revenues.forEach(x => csv += `RECEITA,${x.data_iso},${x.tipo},${x.valor}\n`);
    d.expenses.forEach(x => csv += `DESPESA,${x.data_iso},${x.tipo_principal}-${x.subcategoria},-${x.valor}\n`);
    d.investments.forEach(x => csv += `INVESTIMENTO,${x.data_iso},${x.tipo_principal}-${x.categoria},-${x.valor}\n`);
    download(csv, 'financeiro.csv', 'text/csv');
  });
  document.getElementById('btnExportJSON')?.addEventListener('click', async () => { const d = await window.api.getAllData({ month: selectedMonth, year: selectedYear }); download(JSON.stringify(d, null, 2), 'backup.json', 'application/json'); });

  
  document.getElementById('configEconomiaBtn')?.addEventListener('click', () => document.getElementById('modalEconomia').classList.remove('hidden'));
  document.getElementById('cancelEconomia')?.addEventListener('click', () => document.getElementById('modalEconomia').classList.add('hidden'));
  document.getElementById('saveEconomia')?.addEventListener('click', async () => { 
    const v = parseFloat(document.getElementById('inputEconomia').value); 
    if(v) await window.api.setEconomiaAlvo({ valor: v }); 
    document.getElementById('modalEconomia').classList.add('hidden'); 
    document.dispatchEvent(new CustomEvent('transaction-updated', { detail: {} }));
  });

  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    initCharts();
    reloadAll();
  }
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  });
  
  
  const months = "Janeiro,Fevereiro,Março,Abril,Maio,Junho,Julho,Agosto,Setembro,Outubro,Novembro,Dezembro".split(',');
  document.getElementById('monthSelector').innerHTML = months.map((m, i) => `<option value="${i+1}">${m}</option>`).join('');
  document.getElementById('yearSelector').innerHTML = [2024, 2025, 2026].map(y => `<option value="${y}">${y}</option>`).join('');
  document.getElementById('monthSelector').value = selectedMonth; 
  document.getElementById('yearSelector').value = selectedYear;

  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
});