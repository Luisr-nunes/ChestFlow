# ChestFlow

<!-- badges -->
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) ![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-663399?style=flat-square&logo=css&logoColor=white) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![Axum](https://img.shields.io/badge/Axum-4A4A4A?style=flat-square) ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) ![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)

[Ler em Português](README.md)

A desktop personal finance app that works 100% offline. Income, expenses and investments live in a SQLite database on your own computer; nothing is sent to external servers.

**Download:** [Releases page](https://github.com/Luisr-nunes/ChestFlow/releases/latest), installer for Windows 10/11 64-bit (beta).

## Features

**Income**
- Entries with type, amount and date.
- Recurring income, generated automatically every month.

**Expenses**
- Three groups: fixed, variable and additional, with subcategories (rent, groceries, transport, leisure and more).
- Custom categories.
- Recurring expenses and total spent per category in the month.

**Investments**
- Fixed income, equities and crypto, with subcategories (CDB, Brazilian Treasury bonds, stocks, REITs, Bitcoin and more).
- Recurring contributions.

**Dashboard**
- Monthly summary: income, expenses, invested and balance.
- "Safe to spend": the balance left after setting aside the savings goal.
- Yearly income vs. outflow chart, expense composition, top 8 subcategories and the 7 most recent transactions.

**Settings and reports**
- Monthly savings goal, light or dark theme and a global month/year picker.
- Export of the month's data to CSV.

The UI is in Portuguese.

## Architecture

```
Electron (desktop window)
   └── JavaScript UI + Vite
          │  HTTP on 127.0.0.1:5181
          ▼
   Rust backend (Axum)
          │
          ▼
   SQLite (%APPDATA%/com.chestflow.app/controle_pessoal.db)
```

The Electron main process starts the Rust backend together with the window and stops it when the app closes. In development, the database is isolated in `dev_controle_pessoal.db`.

## Tech stack

| Layer | Technology |
| --- | --- |
| Desktop | Electron, packaged with electron-builder (NSIS and portable) |
| UI | JavaScript (ES Modules), Vite, Chart.js 4, CSS variables with light/dark theme |
| Backend | Rust, Axum, Tokio, Serde |
| Database | SQLite via `rusqlite` (bundled) |

## Structure

```
ChestFlow/
├── electron/
│   ├── main.js        # window, lifecycle and backend startup
│   └── preload.js
├── backend/           # Rust API
│   └── src/           # main.rs (routes), commands.rs, db.rs, models.rs
├── src/               # UI
│   ├── main.js        # navigation
│   ├── pages/         # dashboard, income, expenses, investments, reports
│   ├── components/    # modal and toast
│   ├── services/api.js
│   ├── config/categories.js
│   └── styles/
├── index.html
└── vite.config.js
```

## Running (development)

Requirements: Node.js 18+, Rust (rustup) and, on Windows, Visual Studio Build Tools.

```bash
git clone https://github.com/Luisr-nunes/ChestFlow.git
cd ChestFlow
npm install

# optional, makes startup faster
cd backend && cargo build && cd ..

npm run electron:dev
```

This starts Vite on `http://localhost:5180` and opens Electron, which launches the backend (from the compiled binary or, if it is missing, through `cargo run`).

## Building the installer

```bash
cd backend && cargo build --release && cd ..
npm run electron:build
```

The installer and the portable build are written to `dist-electron/`. Packaging currently targets Windows.

## Author

Luís Nunes — [GitHub](https://github.com/Luisr-nunes) · [LinkedIn](https://www.linkedin.com/in/luis-nunes-dev/)
