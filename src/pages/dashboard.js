import { invokeSafe, fmtMoney, fmtDate, applyMoneyMask } from '../utils.js';
import { getCategoryConfig } from '../categories.js';

let monthlyHistoryChart, expensePieChart, revenuePieChart;

export async function initDashboard(container, period) {
    container.innerHTML = `
        <div class="stats-grid">
            <div class="card stat-card stat-card--receita">
                <p class="stat-card__label">Receita</p>
                <p id="dashboardReceita" class="stat-card__value">R$ 0,00</p>
            </div>
            <div class="card stat-card stat-card--despesas">
                <p class="stat-card__label">Despesas</p>
                <p id="dashboardDespesas" class="stat-card__value">R$ 0,00</p>
            </div>
            <div class="card stat-card stat-card--investido">
                <p class="stat-card__label">Investido</p>
                <p id="dashboardInvestimentos" class="stat-card__value">R$ 0,00</p>
            </div>
            <div class="card stat-card stat-card--saldo">
                <p class="stat-card__label">Saldo</p>
                <p id="dashboardSaldo" class="stat-card__value">R$ 0,00</p>
            </div>
        </div>

        <div class="card safe-to-spend-card">
            <div class="safe-to-spend-card__info">
                <h4>Seguro para Gastar</h4>
                <p id="safeToSpendValue" class="value">R$ 0,00</p>
            </div>
            <button id="configEconomiaBtn" class="btn btn-primary">Configurar Meta</button>
        </div>

        <div class="bottom-section">
            <div class="card chart-container">
                <h3 class="recent-title">Fluxo de Caixa</h3>
                <div class="chart-wrapper"><canvas id="monthlyHistoryChart"></canvas></div>
            </div>
            <div class="card recent-container">
                <h3 class="recent-title">Recentes</h3>
                <div id="recentTransactionsList"></div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:40px">
            <div class="card" style="height:340px;padding:20px;display:flex;flex-direction:column">
                <h3 class="recent-title">Composição das Despesas</h3>
                <div style="position:relative;height:240px;width:100%"><canvas id="expensePieChart"></canvas></div>
            </div>
            <div class="card" style="height:340px;padding:20px;display:flex;flex-direction:column">
                <h3 class="recent-title">Detalhamento de Despesas</h3>
                <div style="position:relative;height:240px;width:100%"><canvas id="revenuePieChart"></canvas></div>
            </div>
        </div>
    `;

    initCharts();
    await updateDashboard(period);

    const btnMeta = document.getElementById('configEconomiaBtn');
    const modalMeta = document.getElementById('modalEconomia');
    const inputMeta = document.getElementById('inputEconomia');
    const btnSaveMeta = document.getElementById('saveEconomia');
    const btnCancelMeta = document.getElementById('cancelEconomia');

    if (btnMeta && modalMeta) {
        applyMoneyMask(inputMeta);
        btnMeta.onclick = async () => {
            const metaAtual = await invokeSafe('get_config', { key: 'meta_economia' }).catch(() => '0');
            inputMeta.value = parseFloat(metaAtual || '0').toFixed(2).replace('.', ',');
            modalMeta.classList.remove('hidden');
            inputMeta.focus();
        };
        btnCancelMeta.onclick = () => modalMeta.classList.add('hidden');
        btnSaveMeta.onclick = async () => {
            const novaMeta = inputMeta.value.replace(/\./g, '').replace(',', '.');
            if (novaMeta !== '' && !isNaN(parseFloat(novaMeta))) {
                await invokeSafe('set_config', { key: 'meta_economia', value: novaMeta });
                modalMeta.classList.add('hidden');
                updateDashboard(period);
            }
        };
    }
}

function initCharts() {
    const style = getComputedStyle(document.body);
    const colorText = '#FFFFFF';
    const gridColor = 'rgba(255,255,255,0.1)';
    const cardBg = style.getPropertyValue('--bg-card').trim() || '#2D3250';

    const doughnutOptions = {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: {
            legend: { position: 'bottom', labels: { color: colorText, usePointStyle: true, boxWidth: 8, font: { family: "'Raleway', sans-serif", size: 12 } } }
        }
    };
const ctxHist = document.getElementById('monthlyHistoryChart')?.getContext('2d');
if (ctxHist) {
    if (monthlyHistoryChart) monthlyHistoryChart.destroy();
    monthlyHistoryChart = new Chart(ctxHist, {
        type: 'bar',
        data: { labels: [], datasets: [
            { label: 'Receita', data: [], backgroundColor: '#04930e', borderRadius: 4 },
            { label: 'Saídas', data: [], backgroundColor: '#bf8441', borderRadius: 4 }
        ]},
        options: {

                scales: {
                    x: { grid: { display: false }, ticks: { color: colorText, font: { family: "'Raleway', sans-serif" } } },
                    y: { grid: { color: gridColor }, ticks: { color: colorText, font: { family: "'Raleway', sans-serif" } } }
                }
            }
        });
    }

    const ctxPieExp = document.getElementById('expensePieChart')?.getContext('2d');
    if (ctxPieExp) {
        if (expensePieChart) expensePieChart.destroy();
        expensePieChart = new Chart(ctxPieExp, {
            type: 'doughnut',
            data: { labels: ['Fixas', 'Variáveis', 'Adicionais'], datasets: [{ data: [0,0,0], backgroundColor: ['#bf8441','#8d534a','#676F9D'], borderColor: cardBg }] },
            options: doughnutOptions
        });
    }

    const ctxPieRev = document.getElementById('revenuePieChart')?.getContext('2d');
    if (ctxPieRev) {
        if (revenuePieChart) revenuePieChart.destroy();
        revenuePieChart = new Chart(ctxPieRev, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderColor: cardBg }] },
            options: doughnutOptions
        });
    }
}

async function updateDashboard(period) {
    try {
        const [revRes, expRes, invRes, history, metaStr] = await Promise.all([
            invokeSafe('list_revenues',    { month: period.month, year: period.year, page_size: 1000 }),
            invokeSafe('list_expenses',    { month: period.month, year: period.year, page_size: 1000 }),
            invokeSafe('list_investments', { month: period.month, year: period.year, page_size: 1000 }),
            invokeSafe('get_annual_history', { year: period.year }),
            invokeSafe('get_config', { key: 'meta_economia' }).catch(() => '0'),
        ]);

        const revenues = revRes.data || [];
        const expenses = expRes.data || [];
        const investments = invRes.data || [];

        const totalRev = revenues.reduce((a, b) => a + b.amount, 0);
        const totalExp = expenses.reduce((a, b) => a + b.amount, 0);
        const totalInv = investments.reduce((a, b) => a + b.amount, 0);
        const saldo = totalRev - totalExp - totalInv;
        const meta = parseFloat(metaStr || '0');

        document.getElementById('dashboardReceita').textContent = fmtMoney(totalRev);
        document.getElementById('dashboardDespesas').textContent = fmtMoney(totalExp);
        document.getElementById('dashboardInvestimentos').textContent = fmtMoney(totalInv);
        document.getElementById('dashboardSaldo').textContent = fmtMoney(saldo);

        const safeEl = document.getElementById('safeToSpendValue');
        if (safeEl) {
            const safe = saldo - meta;
            safeEl.textContent = fmtMoney(safe);
            safeEl.className = 'value ' + (safe >= 0 ? 'value-positive' : 'value-negative');
        }

        const fixas = expenses.filter(e => e.main_type === 'Fixa').reduce((a, b) => a + b.amount, 0);
        const varis = expenses.filter(e => e.main_type === 'Variavel').reduce((a, b) => a + b.amount, 0);
        const adics = expenses.filter(e => e.main_type === 'Adicional').reduce((a, b) => a + b.amount, 0);
        if (expensePieChart) { expensePieChart.data.datasets[0].data = [fixas, varis, adics]; expensePieChart.update(); }

        const subTotais = {};
        expenses.forEach(e => { subTotais[e.subcategory] = (subTotais[e.subcategory] || 0) + e.amount; });
        const subArr = Object.entries(subTotais).map(([k, v]) => ({ subcategoria: k, total: v })).sort((a, b) => b.total - a.total);
        const top8 = subArr.slice(0, 8);
        const outros = subArr.slice(8).reduce((a, c) => a + c.total, 0);
        const labels = top8.map(d => d.subcategoria);
        const data = top8.map(d => d.total);
        if (outros > 0) { labels.push('Outros'); data.push(outros); }
        if (revenuePieChart) {
            revenuePieChart.data.labels = labels;
            revenuePieChart.data.datasets[0].data = data;
            revenuePieChart.data.datasets[0].backgroundColor = labels.map(l => l === 'Outros' ? '#95a5a6' : getCategoryConfig(l).color);
            revenuePieChart.update();
        }

        const all = [
            ...revenues.map(r => ({ ...r, desc: r.type, isRev: true })),
            ...expenses.map(e => ({ ...e, desc: e.subcategory, isRev: false })),
            ...investments.map(i => ({ ...i, desc: i.category, isRev: false })),
        ].sort((a, b) => new Date(b.date_iso) - new Date(a.date_iso)).slice(0, 7);

        const recentList = document.getElementById('recentTransactionsList');
        if (recentList) {
            recentList.innerHTML = !all.length
                ? `<p style="color:var(--text-light);text-align:center;margin-top:20px;">Sem transações.</p>`
                : all.map(t => `
                    <div class="recent-transaction">
                        <div>
                            <p class="recent-transaction__desc">${t.desc}</p>
                            <p class="recent-transaction__date">${fmtDate(t.date_iso)}</p>
                        </div>
                        <span class="recent-transaction__value ${t.isRev ? 'value--in' : 'value--out'}">
                            ${t.isRev ? '+' : '-'} ${fmtMoney(t.amount)}
                        </span>
                    </div>`).join('');
        }

        if (monthlyHistoryChart && history.length) {
            const labels = { 1:'Jan',2:'Fev',3:'Mar',4:'Abr',5:'Mai',6:'Jun',7:'Jul',8:'Ago',9:'Set',10:'Out',11:'Nov',12:'Dez' };
            monthlyHistoryChart.data.labels = history.map(h => labels[h.mes]);
            monthlyHistoryChart.data.datasets[0].data = history.map(h => h.receita);
            monthlyHistoryChart.data.datasets[1].data = history.map(h => h.despesa);
            monthlyHistoryChart.update();
        }
    } catch (err) { console.error('Dashboard error:', err); }
}