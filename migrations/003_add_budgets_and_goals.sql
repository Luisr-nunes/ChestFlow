BEGIN TRANSACTION;

-- (Orçamentos por Categoria)
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria TEXT NOT NULL,
  valor_limite REAL NOT NULL,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(categoria, mes, ano)
);

-- (Metas de Poupança)
CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  valor_meta REAL NOT NULL,
  valor_atual REAL DEFAULT 0,
  data_alvo DATE NOT NULL,
  categoria TEXT,
  ativo INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- (Notificações)
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lido INTEGER DEFAULT 0,
  categoria TEXT,
  valor REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- (configuração global)
CREATE TABLE IF NOT EXISTS config_global (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert configurações padrão
INSERT OR IGNORE INTO config_global (chave, valor) VALUES ('economia_mensal_alvo', '500');
INSERT OR IGNORE INTO config_global (chave, valor) VALUES ('limite_alerta_budget', '80');

COMMIT;
