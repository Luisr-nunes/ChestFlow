import { invokeSafe } from '../services/api.js';
import { fmtMoney, fmtDate } from '../utils/formatters.js';
import { applyMoneyMask } from '../utils/masks.js';
import { getCategoryConfig } from '../config/categories.js';

let monthlyHistoryChart, expensePieChart, revenuePieChart;

// Paleta para o gráfico de anéis concêntricos — segue o design system
const RING_COLORS = ['#a78bfa', '#60a5fa', '#f87171', '#fb923c', '#fbbf24'];

export async function initDashboard(container, period) {
    container.innerHTML = `
        <div class="stats-grid">
            <div class="card stat-card stat-card--receita">
                <p id="dashboardReceita" class="stat-card__value">R$ 0,00</p>
                <p class="stat-card__label">Receita</p>
            </div>
            <div class="card stat-card stat-card--investido">
                <p id="dashboardInvestimentos" class="stat-card__value">R$ 0,00</p>
                <p class="stat-card__label">Investimentos</p>
            </div>
            <div class="card stat-card stat-card--despesas">
                <p id="dashboardDespesas" class="stat-card__value">R$ 0,00</p>
                <p class="stat-card__label">Despesas</p>
            </div>
            <div class="card stat-card stat-card--saldo">
                <p id="dashboardSaldo" class="stat-card__value">R$ 0,00</p>
                <p class="stat-card__label">Saldo</p>
            </div>
            <div class="card safe-to-spend-card">
                <div class="safe-to-spend-card__info">
                    <p id="safeToSpendValue" class="stat-card__value value">R$ 0,00</p>
                    <h4>Seguro Gastar</h4>
                </div>
                <button id="configEconomiaBtn" class="btn btn-primary">Configurar Meta</button>
            </div>
        </div>

        <div class="dashboard-main">
            <div class="dashboard-left">
                <div class="chart-container">
                    <div class="chart-wrapper"><canvas id="monthlyHistoryChart"></canvas></div>
                </div>
                <div class="donuts-row">
                    <div class="card donut-card">
                        <h3 class="recent-title">Composição das Despesas</h3>
                        <div class="donut-wrapper"><canvas id="expensePieChart"></canvas></div>
                    </div>
                    <div class="card donut-card">
                        <h3 class="recent-title">Detalhamento de Despesas</h3>
                        <div class="donut-wrapper"><canvas id="revenuePieChart"></canvas></div>
                    </div>
                </div>
            </div>
            <div class="dashboard-right">
                <div class="card recent-container">
                    <h3 class="recent-title">Lançamentos Recentes</h3>
                    <div id="recentTransactionsList"></div>
                </div>
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
    const style = getComputedStyle(document.documentElement);
    const cardBg = style.getPropertyValue('--bg-card').trim() || '#252f46';
    const borderCol = style.getPropertyValue('--border-color').trim() || '#2e3d5c';

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor  = isDark ? '#e8eaf2' : '#1a2540';
    const gridColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

    const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const doughnutOptions = {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: textColor, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { family: "'Raleway', sans-serif", size: 11 }, padding: 12 }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.label}: ${brl(ctx.parsed)}`
                }
            }
        }
    };

    const allMonths = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    const ctxHist = document.getElementById('monthlyHistoryChart')?.getContext('2d');
    if (ctxHist) {
        if (monthlyHistoryChart) monthlyHistoryChart.destroy();
        monthlyHistoryChart = new Chart(ctxHist, {
            type: 'bar',
            data: { labels: allMonths, datasets: [
                {
                    label: 'Receitas',
                    data: new Array(12).fill(0),
                    backgroundColor: 'rgba(167,139,250,0.85)',
                    hoverBackgroundColor: '#a78bfa',
                    borderRadius: { topLeft: 5, topRight: 5 },
                    borderSkipped: 'start',
                    barPercentage: 0.45,
                    categoryPercentage: 0.8,
                },
                {
                    label: 'Despesas',
                    data: new Array(12).fill(0),
                    backgroundColor: 'rgba(248,113,113,0.80)',
                    hoverBackgroundColor: '#f87171',
                    borderRadius: { topLeft: 5, topRight: 5 },
                    borderSkipped: 'start',
                    barPercentage: 0.45,
                    categoryPercentage: 0.8,
                }
            ]},
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top', align: 'center',
                        labels: { color: textColor, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { family: "'Raleway', sans-serif", size: 12 }, padding: 16 }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e2d4a' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDark ? 'rgba(167,139,250,0.2)' : 'rgba(0,0,0,0.08)',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: (ctx) => ` ${ctx.dataset.label}: ${brl(ctx.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, border: { display: false }, ticks: { color: textColor, font: { family: "'Raleway', sans-serif", size: 11 } } },
                    y: { grid: { color: gridColor }, border: { display: false }, ticks: { color: textColor, font: { family: "'Raleway', sans-serif", size: 11 }, callback: (v) => brl(v) } }
                }
            }
        });
    }

    const ctxPieExp = document.getElementById('expensePieChart')?.getContext('2d');
    if (ctxPieExp) {
        if (expensePieChart) expensePieChart.destroy();
        expensePieChart = new Chart(ctxPieExp, {
            type: 'doughnut',
            data: {
                labels: ['Fixas', 'Variáveis', 'Adicionais'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#a78bfa', '#fb923c', '#60a5fa'],
                    borderColor: cardBg,
                    borderWidth: 3,
                    hoverOffset: 6,
                }]
            },
            options: { ...doughnutOptions, cutout: '60%' }
        });
    }

    const ctxPieRev = document.getElementById('revenuePieChart')?.getContext('2d');
    if (ctxPieRev) {
        if (revenuePieChart) revenuePieChart.destroy();
        revenuePieChart = new Chart(ctxPieRev, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderColor: cardBg,
                    borderWidth: 3,
                    hoverOffset: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            font: { family: "'Raleway', sans-serif", size: 11 },
                            padding: 10,
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e2d4a' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDark ? 'rgba(167,139,250,0.2)' : 'rgba(0,0,0,0.08)',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${brl(ctx.parsed)}`
                        }
                    }
                }
            }
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
            safeEl.className = 'stat-card__value value';
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
            const top5 = subArr.slice(0, 5);
            revenuePieChart.data.labels = top5.map(d => d.subcategoria);
            revenuePieChart.data.datasets[0].data = top5.map(d => d.total);
            revenuePieChart.data.datasets[0].backgroundColor = top5.map((_, i) => RING_COLORS[i % RING_COLORS.length]);
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

        if (monthlyHistoryChart) {
            const receitas = new Array(12).fill(0);
            const despesas = new Array(12).fill(0);
            if (history && history.length) {
                history.forEach(h => {
                    const idx = h.mes - 1;
                    if (idx >= 0 && idx < 12) {
                        receitas[idx] = h.receita || 0;
                        despesas[idx] = h.despesa || 0;
                    }
                });
            }
            monthlyHistoryChart.data.datasets[0].data = receitas;
            monthlyHistoryChart.data.datasets[1].data = despesas;
            monthlyHistoryChart.update();
        }
    } catch (err) { console.error('Dashboard error:', err); }
}