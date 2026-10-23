# ChestFlow

[Read in English](README.en.md)

Aplicativo desktop de controle financeiro pessoal que funciona 100% offline. Receitas, despesas e investimentos ficam em um banco SQLite no próprio computador; nada é enviado para servidores externos.

**Download:** [página de Releases](https://github.com/Luisr-nunes/ChestFlow/releases/latest), instalador para Windows 10/11 64 bits (versão beta).

## Funcionalidades

**Receitas**
- Lançamento com tipo, valor e data.
- Receitas recorrentes, geradas automaticamente a cada mês.

**Despesas**
- Três grupos: fixa, variável e adicional, com subcategorias (aluguel, supermercado, transporte, lazer etc.).
- Categorias personalizadas.
- Despesas recorrentes e total gasto por categoria no mês.

**Investimentos**
- Renda fixa, renda variável e criptomoedas, com subcategorias (CDB, Tesouro Direto, ações, FIIs, Bitcoin etc.).
- Aportes recorrentes.

**Dashboard**
- Resumo do mês: receitas, despesas, investido e saldo.
- "Seguro para gastar": saldo disponível depois de reservar a meta de economia.
- Gráfico anual de entradas e saídas, composição das despesas, 8 maiores subcategorias e 7 transações mais recentes.

**Configurações e relatórios**
- Meta de economia mensal, tema claro ou escuro e seletor global de mês/ano.
- Exportação dos dados do mês em CSV.

## Arquitetura

```
Electron (janela desktop)
   └── interface em JavaScript + Vite
          │  HTTP em 127.0.0.1:5181
          ▼
   backend em Rust (Axum)
          │
          ▼
   SQLite (%APPDATA%/com.chestflow.app/controle_pessoal.db)
```

O processo principal do Electron inicia o backend em Rust junto com a janela e o encerra ao fechar o app. Em desenvolvimento, o banco fica isolado em `dev_controle_pessoal.db`.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Desktop | Electron, empacotado com electron-builder (NSIS e portátil) |
| Interface | JavaScript (ES Modules), Vite, Chart.js 4, CSS com variáveis e tema claro/escuro |
| Backend | Rust, Axum, Tokio, Serde |
| Banco de dados | SQLite via `rusqlite` (compilado junto) |

## Estrutura

```
ChestFlow/
├── electron/
│   ├── main.js        # janela, ciclo de vida e inicialização do backend
│   └── preload.js
├── backend/           # API em Rust
│   └── src/           # main.rs (rotas), commands.rs, db.rs, models.rs
├── src/               # interface
│   ├── main.js        # navegação
│   ├── pages/         # dashboard, receitas, despesas, investimentos, relatórios
│   ├── components/    # modal e toast
│   ├── services/api.js
│   ├── config/categories.js
│   └── styles/
├── index.html
└── vite.config.js
```

## Como executar (desenvolvimento)

Pré-requisitos: Node.js 18+, Rust (rustup) e, no Windows, o Visual Studio Build Tools.

```bash
git clone https://github.com/Luisr-nunes/ChestFlow.git
cd ChestFlow
npm install

# opcional, deixa a inicialização mais rápida
cd backend && cargo build && cd ..

npm run electron:dev
```

O comando sobe o Vite em `http://localhost:5180` e abre o Electron, que inicia o backend (pelo binário compilado ou, se ele não existir, por `cargo run`).

## Gerar o instalador

```bash
cd backend && cargo build --release && cd ..
npm run electron:build
```

O instalador e a versão portátil ficam em `dist-electron/`. O empacotamento atual é voltado para Windows.

## Autor

Luís Nunes — [GitHub](https://github.com/Luisr-nunes) · [LinkedIn](https://www.linkedin.com/in/luis-nunes-dev/)
