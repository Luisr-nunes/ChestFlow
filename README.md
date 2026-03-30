<div align="center">

<img src="src-tauri/icons/icon.png" alt="ChestFlow Logo" width="120" />

# ChestFlow

**PT** | [EN](#english-version)

> Controle financeiro pessoal offline — rápido, seguro e sem depender da nuvem.

[![Version](https://img.shields.io/badge/version-1.0.0--beta-orange?style=flat-square)](https://github.com/Luisr-nunes/chestflow/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square&logo=windows)](https://github.com/Luisr-nunes/chestflow/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8D8?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-backend-000000?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)

</div>

---

##  Sobre o Projeto

O **ChestFlow** é um aplicativo desktop de controle financeiro pessoal desenvolvido para funcionar 100% offline. Todos os dados ficam armazenados localmente no seu computador — nenhuma informação é enviada para servidores externos.

Desenvolvido com **Tauri 2** e **Rust** no backend, oferece desempenho nativo com instalador leve e consumo mínimo de memória comparado a soluções baseadas em Electron.

---

##  Funcionalidades

###  Receitas
- Cadastro de receitas com tipo, valor e data
- Suporte a lançamentos recorrentes (repetição automática todo mês)
- Filtros por categoria e data
- Edição e exclusão com confirmação

###  Despesas
- Categorização em três grupos: **Fixa**, **Variável** e **Adicional**
- Subcategorias detalhadas (Aluguel, Supermercado, Uber, Lazer, etc.)
- Suporte a categorias personalizadas
- Lançamentos recorrentes com geração automática mensal
- Filtro por categoria com exibição do total gasto no mês

###  Investimentos
- Registro de investimentos por tipo: Renda Fixa, Renda Variável e Criptomoedas
- Subcategorias específicas (CDB, Tesouro Direto, Ações, FIIs, Bitcoin, etc.)
- Suporte a aportes recorrentes

###  Dashboard
- Resumo do mês: Receita, Despesas, Investido e Saldo
- **"Seguro para Gastar"**: saldo disponível após descontar a meta de economia
- Gráfico de barras com histórico anual de receitas vs saídas
- Gráfico de composição das despesas (Fixa / Variável / Adicional)
- Gráfico de detalhamento por subcategoria (top 8 categorias)
- Lista das 7 transações mais recentes do mês

###  Configurações
- Meta de economia mensal configurável
- Alternância entre tema claro e escuro
- Navegação por mês e ano com seletor global

###  Exportação
- Exportação dos dados do mês em formato **CSV**

---

##  Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
|--------|-----------|-----------|
| Framework Desktop | **Tauri 2** | Framework para apps desktop leves e seguros |
| Backend | **Rust** | Lógica de negócio, banco de dados e comandos IPC |
| Banco de Dados | **SQLite** (rusqlite) | Armazenamento local via rusqlite com feature bundled |
| Frontend | **JavaScript ES Modules** | Interface modular organizada por página |
| Bundler | **Vite 5** | Build e hot-reload do frontend |
| Gráficos | **Chart.js 4** | Visualizações de dados financeiros |
| Estilo | **CSS3 + Variables** | Design system com suporte a tema claro/escuro |

### Por que Tauri + Rust?

- **Performance**: backend em Rust compilado nativamente, sem overhead do Node.js
- **Tamanho**: instalador ~195MB (incluindo WebView2) vs ~300MB+ do Electron
- **Segurança**: dados armazenados localmente, sem telemetria, sem nuvem
- **Perfil no GitHub**: Rust contabiliza como linguagem no repositório

---

##  Escolhas de UX e Design

### Layout
- Estrutura de **duas colunas**: sidebar fixa à esquerda + área de conteúdo à direita
- Navegação lateral com indicador de página ativa
- Seletor de mês/ano global no cabeçalho, disponível em todas as telas

### Hierarquia Visual
- Cards de resumo com codificação por cor: verde (receita), vermelho (despesas), azul (investimentos), roxo (saldo)
- Card "Seguro para Gastar" em largura total com destaque de meta
- Valores negativos exibidos em vermelho, positivos em verde

### Tema
- Suporte nativo a **tema claro e escuro**
- Preferência persistida localmente entre sessões
- CSS Variables para troca instantânea de tema sem reload

### Categorias
- Sistema hierárquico: tipo principal → subcategoria
- Opção "Outros" com campo de texto livre para categorias não listadas
- Cores únicas por categoria nos gráficos de detalhamento

### Feedback
- Notificações **toast** não-bloqueantes para confirmação de ações
- Badges visuais identificando lançamentos recorrentes nas tabelas
- Mensagens de estado vazio em todas as listagens

---

##  Como Instalar (Testers)

> Não é necessário instalar Node.js, Rust ou qualquer ferramenta de desenvolvimento.

1. Acesse a página de [Releases](https://github.com/Luisr-nunes/chestflow/releases)
2. Baixe o arquivo `ChestFlow_1.0.0_x64_en-US.zip`
3. Extraia o arquivo `.zip`
4. Clique duas vezes no arquivo `.msi`
5. Se aparecer aviso de segurança do Windows, clique em **Mais informações → Executar assim mesmo**
6. Siga o instalador normalmente
7. O ChestFlow aparecerá no menu Iniciar

> **Requisito:** Windows 10/11 64-bit

---

##  Como Rodar o Código (Desenvolvedores)

### Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- [Rust](https://rustup.rs)
- Windows 10/11 com [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Luisr-nunes/chestflow.git
cd chestflow

# Instale as dependências JavaScript
npm install
```

### Desenvolvimento

```bash
# Modo desenvolvimento com hot-reload
npm run tauri:dev
```

> A primeira execução demora entre 5 e 10 minutos para compilar as dependências Rust. As próximas são rápidas.

### Build de Produção

```bash
# Gera o instalador .msi em src-tauri/target/release/bundle/msi/
npm run tauri:build
```

---

##  Estrutura do Projeto

```
chestflow/
├── src/                      # Frontend JavaScript
│   ├── main.js               # Entry point e navegação
│   ├── utils.js              # Helpers (invoke, formatadores)
│   ├── categories.js         # Configuração de categorias e cores
│   ├── pages/
│   │   ├── dashboard.js      # Página do dashboard
│   │   ├── revenues.js       # Página de receitas
│   │   ├── expenses.js       # Página de despesas
│   │   ├── investments.js    # Página de investimentos
│   │   └── reports.js        # Exportação de dados
│   └── components/
│       ├── toast.js          # Notificações
│       ├── modal.js          # Modais de formulário
│       └── charts.js         # Configuração dos gráficos
├── src-tauri/                # Backend Rust
│   ├── src/
│   │   ├── main.rs           # Entry point Tauri
│   │   ├── commands.rs       # Comandos IPC expostos ao frontend
│   │   ├── db.rs             # Banco de dados e recorrência
│   │   └── models.rs         # Structs de dados
│   ├── Cargo.toml            # Dependências Rust
│   └── tauri.conf.json       # Configuração do app
├── index.html                # HTML principal
├── style.css                 # Estilos globais
└── vite.config.js            # Configuração do Vite
```

---

##  Desenvolvido por

**Luis Nunes** — [@Luisr-nunes](https://github.com/Luisr-nunes)

---

---

<div align="center">

<a name="english-version"></a>

# ChestFlow

[PT](#) | **EN**

> Personal offline financial control — fast, secure and cloud-free.

</div>

---

##  About

**ChestFlow** is a desktop personal finance app built to work 100% offline. All data is stored locally on your computer — no information is sent to external servers.

Built with **Tauri 2** and **Rust** on the backend, it delivers native performance with a lightweight installer and minimal memory usage compared to Electron-based solutions.

---

##  Features

###  Revenues
- Register revenues with type, amount and date
- Recurring entries (auto-generated every month)
- Filter by category and date

###  Expenses
- Three groups: **Fixed**, **Variable** and **Additional**
- Detailed subcategories (Rent, Supermarket, Uber, Leisure, etc.)
- Custom categories support
- Recurring expenses with automatic monthly generation
- Category filter with monthly total display

###  Investments
- Track investments by type: Fixed Income, Variable Income and Cryptocurrencies
- Specific subcategories (CDB, Treasury, Stocks, REITs, Bitcoin, etc.)
- Recurring contributions support

###  Dashboard
- Monthly summary: Revenue, Expenses, Invested and Balance
- **"Safe to Spend"**: available balance after subtracting savings goal
- Annual bar chart: revenues vs expenses
- Expense composition chart (Fixed / Variable / Additional)
- Subcategory breakdown chart (top 8)
- Last 7 transactions list

###  Settings
- Configurable monthly savings goal
- Light and dark theme toggle
- Global month/year selector

###  Export
- Export monthly data as **CSV**

---

##  Tech Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| Desktop Framework | **Tauri 2** | Lightweight and secure desktop app framework |
| Backend | **Rust** | Business logic, database and IPC commands |
| Database | **SQLite** (rusqlite) | Local storage via rusqlite with bundled feature |
| Frontend | **JavaScript ES Modules** | Modular interface organized by page |
| Bundler | **Vite 5** | Frontend build and hot-reload |
| Charts | **Chart.js 4** | Financial data visualizations |
| Styling | **CSS3 + Variables** | Design system with light/dark theme support |

---

##  UX & Design Choices

- **Two-column layout**: fixed sidebar + content area
- Color-coded summary cards: green (revenue), red (expenses), blue (investments), purple (balance)
- Native **light and dark theme** support with persistent preference
- **Toast notifications** for non-blocking action feedback
- Visual badges identifying recurring entries in tables
- Hierarchical category system with custom category support

---

##  How to Install (Testers)

> No Node.js, Rust or developer tools required.

1. Go to [Releases](https://github.com/Luisr-nunes/chestflow/releases)
2. Download `ChestFlow_1.0.0_x64_en-US.zip`
3. Extract the `.zip` file
4. Double-click the `.msi` file
5. If a Windows security warning appears, click **More info → Run anyway**
6. Follow the installer steps
7. ChestFlow will appear in the Start menu

> **Requirement:** Windows 10/11 64-bit

---

##  How to Run the Code (Developers)

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Rust](https://rustup.rs)
- Windows 10/11 with [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Setup

```bash
# Clone the repository
git clone https://github.com/Luisr-nunes/chestflow.git
cd chestflow

# Install JavaScript dependencies
npm install
```

### Development

```bash
# Development mode with hot-reload
npm run tauri:dev
```

> The first run takes 5–10 minutes to compile Rust dependencies. Subsequent runs are fast.

### Production Build

```bash
# Generates the .msi installer in src-tauri/target/release/bundle/msi/
npm run tauri:build
```

---

## Project Structure

```
chestflow/
├── src/                      # JavaScript frontend
│   ├── main.js               # Entry point and navigation
│   ├── utils.js              # Helpers (invoke, formatters)
│   ├── categories.js         # Category config and colors
│   ├── pages/
│   │   ├── dashboard.js      # Dashboard page
│   │   ├── revenues.js       # Revenues page
│   │   ├── expenses.js       # Expenses page
│   │   ├── investments.js    # Investments page
│   │   └── reports.js        # Data export
│   └── components/
│       ├── toast.js          # Notifications
│       ├── modal.js          # Form modals
│       └── charts.js         # Chart configuration
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs           # Tauri entry point
│   │   ├── commands.rs       # IPC commands exposed to frontend
│   │   ├── db.rs             # Database and recurrence logic
│   │   └── models.rs         # Data structs
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # App configuration
├── index.html                # Main HTML
├── style.css                 # Global styles
└── vite.config.js            # Vite configuration
```

---

##  Developed by

**Luis Nunes** — [@Luisr-nunes](https://github.com/Luisr-nunes)
