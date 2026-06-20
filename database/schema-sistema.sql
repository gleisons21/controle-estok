-- Tabela de backup
CREATE TABLE IF NOT EXISTS backups (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tamanho_mb DECIMAL(10, 2),
  data_backup TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_restauracao TIMESTAMP,
  status VARCHAR(50) DEFAULT 'sucesso',
  caminho VARCHAR(500)
);

-- Tabela de notificacoes
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50),
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  referencia_id INTEGER,
  referencia_tabela VARCHAR(100),
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lida_em TIMESTAMP
);

-- Tabela de configuracoes do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(255) NOT NULL UNIQUE,
  valor TEXT,
  tipo VARCHAR(50),
  descricao TEXT,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relatorios agendados
CREATE TABLE IF NOT EXISTS relatorios_agendados (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  frequencia VARCHAR(50),
  destinatario_email VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  proxima_execucao TIMESTAMP,
  ultima_execucao TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_backups_data ON backups(data_backup);
CREATE INDEX idx_configuracoes_chave ON configuracoes(chave);