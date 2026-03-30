const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Resumo e Meta
  getSummary: (opts) => ipcRenderer.invoke("db/get-summary", opts),
  getSafeToSpend: (opts) => ipcRenderer.invoke("db/get-safe-to-spend", opts),
  setEconomiaAlvo: (data) => ipcRenderer.invoke("db/set-economia-alvo", data),
  getMonthlyHistory: () => ipcRenderer.invoke("db/get-monthly-history"),
getRecentTransactions: (opts) => ipcRenderer.invoke("db/get-recent-transactions", opts),  
  // Dados
  getAllData: (opts) => ipcRenderer.invoke("db/get-all-data", opts),
  getExpensesBySubcategory: (opts) => ipcRenderer.invoke("db/get-expenses-by-subcategory", opts),
  
  // CRUDs
  addExpense: (data) => ipcRenderer.invoke("db/add-expense", data),
  updateExpense: (data) => ipcRenderer.invoke("db/update-expense", data),
  deleteExpense: (id) => ipcRenderer.invoke("db/delete-expense", id),
  listExpenses: (opts) => ipcRenderer.invoke("db/list-expenses", opts),

  addRevenue: (data) => ipcRenderer.invoke("db/add-revenue", data),
  updateRevenue: (data) => ipcRenderer.invoke("db/update-revenue", data),
  deleteRevenue: (id) => ipcRenderer.invoke("db/delete-revenue", id),
  listRevenues: (opts) => ipcRenderer.invoke("db/list-revenues", opts),

  addInvestment: (data) => ipcRenderer.invoke("db/add-investment", data),
  updateInvestment: (data) => ipcRenderer.invoke("db/update-investment", data),
  deleteInvestment: (id) => ipcRenderer.invoke("db/delete-investment", id),
  listInvestments: (opts) => ipcRenderer.invoke("db/list-investments", opts),
});