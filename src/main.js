import { initReports } from './pages/reports.js';
import { initDashboard } from './pages/dashboard.js';
import { initRevenues } from './pages/revenues.js';
import { initExpenses } from './pages/expenses.js';
import { initInvestments } from './pages/investments.js';
import { getYearsRange } from './utils.js';

window.currentPeriod = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
};

const routes = {
    'dashboard':   initDashboard,
    'revenues':    initRevenues,
    'expenses':    initExpenses,
    'investments': initInvestments,
    'reports':     initReports
};

async function navigate(pageId) {
    const container = document.getElementById(pageId);
    if (!container) return;
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    container.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });
    const navBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
    if (navBtn) document.getElementById('pageTitle').textContent = navBtn.textContent.trim();
    if (routes[pageId]) await routes[pageId](container, window.currentPeriod);
}

document.addEventListener('DOMContentLoaded', () => {
    const monthSelector = document.getElementById('monthSelector');
    const yearSelector  = document.getElementById('yearSelector');

    const months = "Janeiro,Fevereiro,Março,Abril,Maio,Junho,Julho,Agosto,Setembro,Outubro,Novembro,Dezembro".split(',');
    if (monthSelector) monthSelector.innerHTML = months.map((m, i) => `<option value="${i+1}">${m}</option>`).join('');

    if (yearSelector) {
        const years = getYearsRange();
        yearSelector.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    }

    if (monthSelector && yearSelector) {
        monthSelector.value = window.currentPeriod.month;
        yearSelector.value  = window.currentPeriod.year;

        const handlePeriodChange = () => {
            window.currentPeriod.month = parseInt(monthSelector.value);
            window.currentPeriod.year  = parseInt(yearSelector.value);
            const activeBtn = document.querySelector('.nav-btn.active');
            if (activeBtn) navigate(activeBtn.dataset.page);
        };

        monthSelector.addEventListener('change', handlePeriodChange);
        yearSelector.addEventListener('change', handlePeriodChange);
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => navigate(btn.dataset.page));
    });

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
    applyTheme(localStorage.getItem('theme') || 'light');

    document.getElementById('themeToggleBtn').addEventListener('click', () => {
        const current = localStorage.getItem('theme') || 'light';
        applyTheme(current === 'light' ? 'dark' : 'light');
        const activeBtn = document.querySelector('.nav-btn.active');
        if (activeBtn?.dataset.page === 'dashboard') navigate('dashboard');
    });

    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            
            setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 300);
        });
    }

    navigate('dashboard');
});