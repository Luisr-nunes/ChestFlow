 
export const getDoughnutOptions = (colorText) => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: colorText,
        usePointStyle: true,
        padding: 15,
        font: { family: "'Poppins', sans-serif", size: 11 }
      }
    }
  }
});

 
export const createHistoryChart = (ctx, data, colorText, gridColor) => {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        { label: 'Receita', data: data.receitas, backgroundColor: '#2ecc71', borderRadius: 4 },
        { label: 'Saídas', data: data.despesas, backgroundColor: '#e74c3c', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: colorText }, grid: { display: false } },
        y: { ticks: { color: colorText }, grid: { color: gridColor, borderDash: [4, 4] } }
      },
      plugins: { legend: { labels: { color: colorText, usePointStyle: true } } }
    }
  });
};