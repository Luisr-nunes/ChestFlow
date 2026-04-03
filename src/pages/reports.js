import { invokeSafe } from '../services/api.js';
import { showToast } from '../components/toast.js';

export async function initReports(container, period) {
    const btnCSV = document.getElementById('btnExportCSV');
    if(!btnCSV) return;

    const newBtn = btnCSV.cloneNode(true);
    btnCSV.parentNode.replaceChild(newBtn, btnCSV);

    newBtn.onclick = async () => {
        try {
            showToast('Preparando exportação...', 'info');
            
            const [revRes, expRes, invRes] = await Promise.all([
                invokeSafe('list_revenues',    { month: period.month, year: period.year, page_size: 5000 }),
                invokeSafe('list_expenses',    { month: period.month, year: period.year, page_size: 5000 }),
                invokeSafe('list_investments', { month: period.month, year: period.year, page_size: 5000 }),
            ]);

            const revenues = revRes.data || [];
            const expenses = expRes.data || [];
            const investments = invRes.data || [];

            let csv = "\uFEFFTIPO,DATA,CATEGORIA,VALOR\n";
            // FIX: usa x.type (campo serializado pelo backend via serde rename)
            revenues.forEach(x => csv += `RECEITA,${x.date_iso},${x.type},${x.amount}\n`);
            expenses.forEach(x => csv += `DESPESA,${x.date_iso},${x.main_type} - ${x.subcategory},-${x.amount}\n`);
            investments.forEach(x => csv += `INVESTIMENTO,${x.date_iso},${x.main_type} - ${x.category},-${x.amount}\n`);

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_financas_${period.month}_${period.year}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('Exportação concluída!', 'success');
        } catch (err) {
            showToast("Erro ao exportar: " + err, 'error');
        }
    };
}