<div align="center">

<img width="100" src="https://raw.githubusercontent.com/Luisr-nunes/ChestFlow/main/assets/icons/icon.png" alt="ChestFlow Logo" onerror="this.style.display='none'"/>

# ChestFlow

**PT** | [EN](#english-version)

> Controle financeiro pessoal offline — rápido, seguro e sem depender da nuvem.

<br>

[![Version](https://img.shields.io/badge/version-1.1.0--beta-orange?style=flat-square)](https://github.com/Luisr-nunes/ChestFlow/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square&logo=windows)](https://github.com/Luisr-nunes/ChestFlow/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/Luisr-nunes/ChestFlow/blob/main/LICENSE)
[![Electron](https://img.shields.io/badge/Electron-desktop-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-backend-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Rust](https://img.shields.io/badge/Rust-core-000000?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![SQLite](https://img.shields.io/badge/SQLite-database-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)

<br>

### Download

[![Download ChestFlow v1.1.0](https://img.shields.io/badge/⬇%EF%B8%8F%20%20Download%20ChestFlow%20v1.1.0%20%20|%20%20Windows%2010%2F11%20%E2%80%94%20Grátis-2ea44f?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/Luisr-nunes/ChestFlow/releases/download/v1.1.0/ChestFlow.Setup.1.1.0.exe)

> Clique no botão acima para baixar direto. Sem cadastro, sem assinatura.

</div>

---

## Sobre o Projeto

O **ChestFlow** é um aplicativo desktop de controle financeiro pessoal desenvolvido para funcionar **100% offline**. Todos os dados ficam armazenados localmente no seu computador — nenhuma informação é enviada para servidores externos.

Construído com **Electron** para a camada desktop e interface, **Node.js** para a lógica de aplicação e **Rust** no núcleo do backend, garantindo desempenho sólido com armazenamento seguro via SQLite.

---

## Funcionalidades

### Receitas
- Cadastro de receitas com tipo, valor e data
- Suporte a lançamentos recorrentes (repetição automática mensal)
- Filtros por categoria e data

### Despesas
- Categorização em três grupos: **Fixa**, **Variável** e **Adicional**
- Subcategorias detalhadas (Aluguel, Supermercado, Uber, Lazer, etc.)
- Suporte a categorias personalizadas
- Lançamentos recorrentes com geração automática mensal
- Filtro por categoria com exibição do total gasto no mês

### Investimentos
- Registro por tipo: Renda Fixa, Renda Variável e Criptomoedas
- Subcategorias específicas (CDB, Tesouro Direto, Ações, FIIs, Bitcoin, etc.)
- Suporte a aportes recorrentes

### Dashboard
- Resumo do mês: Receita, Despesas, Investido e Saldo
- **"Seguro para Gastar"**: saldo disponível após descontar a meta de economia
- Gráfico anual de receitas vs saídas
- Gráfico de composição das despesas (Fixa / Variável / Adicional)
- Top 8 subcategorias de gastos
- Lista das 7 transações mais recentes

### Configurações
- Meta de economia mensal configurável
- Alternância entre tema claro e escuro
- Seletor global de mês/ano

### Exportação
- Exportação dos dados do mês em formato **CSV**

---

## Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
|---|---|---|
| Framework Desktop | **Electron** | Wrapper desktop cross-platform via Chromium + Node |
| Lógica de Aplicação | **Node.js** | IPC, orquestração e comunicação entre processos |
| Core / Backend | **Rust** | Lógica de negócio de alta performance |
| Banco de Dados | **SQLite** | Armazenamento local via binding Rust |
| Frontend | **JavaScript ES Modules** | Interface modular organizada por página |
| Bundler | **Vite** | Build e hot-reload do frontend |
| Gráficos | **Chart.js 4** | Visualizações de dados financeiros |
| Estilo | **CSS3 + Variables** | Design system com suporte a tema claro/escuro |

---

## Como Instalar (Testers)

> Não é necessário instalar Node.js, Rust ou qualquer ferramenta de desenvolvimento.

1. Acesse a página de [**Releases**](https://github.com/Luisr-nunes/ChestFlow/releases)
2. Baixe o instalador mais recente (`.exe` ou `.zip`)
3. Execute o instalador e siga os passos
4. Se aparecer aviso de segurança do Windows, clique em **Mais informações → Executar assim mesmo**
5. O ChestFlow aparecerá no menu Iniciar

> **Requisito:** Windows 10/11 64-bit

---

## Como Rodar o Código (Desenvolvedores)

### Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- [Rust](https://rustup.rs)
- Windows 10/11 com [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Luisr-nunes/ChestFlow.git
cd ChestFlow

# Instale as dependências JavaScript
npm install
```

### Desenvolvimento

```bash
# Modo desenvolvimento com hot-reload
npm run dev
```

### Build de Produção

```bash
# Gera o instalador na pasta dist/
npm run build
```

---

## Estrutura do Projeto

```
ChestFlow/
├── assets/
│   └── icons/                # Ícones do aplicativo
├── backend/                  # Core em Rust
│   └── src/                  # Lógica de negócio, banco de dados e modelos
├── electron/                 # Processo principal do Electron
│   └── main.js               # Entry point, IPC e ciclo de vida do app
├── src/                      # Frontend JavaScript
│   ├── main.js               # Navegação e entry point da UI
│   ├── pages/                # Módulos de cada tela (dashboard, receitas, etc.)
│   └── components/           # Componentes reutilizáveis (toast, modal, charts)
├── index.html                # HTML principal
├── vite.config.js            # Configuração do Vite
└── package.json              # Dependências e scripts
```

---

## Desenvolvido por

<div align="center">

**Luis Nunes**

[![GitHub](https://img.shields.io/badge/GitHub-Luisr--nunes-181717?style=flat-square&logo=github)](https://github.com/Luisr-nunes)

</div>

---

<br>
<br>

---

<div align="center" id="english-version">

# ChestFlow

[PT](#) | **EN**

> Personal offline financial control — fast, secure and cloud-free.

<br>

### Download

[![Download ChestFlow v1.1.0](https://img.shields.io/badge/⬇%EF%B8%8F%20%20Download%20ChestFlow%20v1.1.0%20%20|%20%20Windows%2010%2F11%20—%20Free-2ea44f?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/Luisr-nunes/ChestFlow/releases/download/v1.1.0/ChestFlow.Setup.1.1.0.exe)

> Click the button above to download directly. No sign-up, no subscription.

</div>

---

## About

**ChestFlow** is a desktop personal finance app built to work **100% offline**. All data is stored locally on your computer — no information is sent to external servers.

Built with **Electron** for the desktop and UI layer, **Node.js** for application logic, and **Rust** at the backend core, delivering solid performance with secure local storage via SQLite.

---

## Features

### Revenues
- Register revenues with type, amount and date
- Recurring entries (auto-generated every month)
- Filter by category and date

### Expenses
- Three groups: **Fixed**, **Variable** and **Additional**
- Detailed subcategories (Rent, Supermarket, Uber, Leisure, etc.)
- Custom categories support
- Recurring expenses with automatic monthly generation

### Investments
- Track by type: Fixed Income, Variable Income and Cryptocurrencies
- Specific subcategories (CDB, Treasury, Stocks, REITs, Bitcoin, etc.)
- Recurring contributions support

### Dashboard
- Monthly summary: Revenue, Expenses, Invested and Balance
- **"Safe to Spend"**: available balance after subtracting savings goal
- Annual bar chart: revenues vs expenses
- Expense composition chart (Fixed / Variable / Additional)
- Top 8 subcategory breakdown
- Last 7 transactions list

### Settings
- Configurable monthly savings goal
- Light and dark theme toggle
- Global month/year selector

### Export
- Export monthly data as **CSV**

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| Desktop Framework | **Electron** | Cross-platform desktop via Chromium + Node |
| App Logic | **Node.js** | IPC, orchestration and inter-process communication |
| Core / Backend | **Rust** | High-performance business logic |
| Database | **SQLite** | Local storage via Rust binding |
| Frontend | **JavaScript ES Modules** | Modular UI organized by page |
| Bundler | **Vite** | Frontend build and hot-reload |
| Charts | **Chart.js 4** | Financial data visualizations |
| Styling | **CSS3 + Variables** | Design system with light/dark theme support |

---

## How to Install (Testers)

> No Node.js, Rust or developer tools required.

1. Go to the [**Releases**](https://github.com/Luisr-nunes/ChestFlow/releases) page
2. Download the latest installer (`.exe` or `.zip`)
3. Run the installer and follow the steps
4. If a Windows security warning appears, click **More info → Run anyway**
5. ChestFlow will appear in the Start menu

> **Requirement:** Windows 10/11 64-bit

---

## How to Run the Code (Developers)

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Rust](https://rustup.rs)
- Windows 10/11 with [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Setup

```bash
# Clone the repository
git clone https://github.com/Luisr-nunes/ChestFlow.git
cd ChestFlow

# Install JavaScript dependencies
npm install
```

### Development

```bash
# Development mode with hot-reload
npm run dev
```

### Production Build

```bash
# Generates the installer in dist/
npm run build
```

---

## Project Structure

```
ChestFlow/
├── assets/
│   └── icons/                # App icons
├── backend/                  # Rust core
│   └── src/                  # Business logic, database and models
├── electron/                 # Electron main process
│   └── main.js               # Entry point, IPC and app lifecycle
├── src/                      # JavaScript frontend
│   ├── main.js               # Navigation and UI entry point
│   ├── pages/                # Page modules (dashboard, revenues, etc.)
│   └── components/           # Reusable components (toast, modal, charts)
├── index.html                # Main HTML
├── vite.config.js            # Vite configuration
└── package.json              # Dependencies and scripts
```

---

## Developed by

<div align="center">

**Luis Nunes**

[![GitHub](https://img.shields.io/badge/GitHub-Luisr--nunes-181717?style=flat-square&logo=github)](https://github.com/Luisr-nunes)

</div>