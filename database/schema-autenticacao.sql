-- Tabela de usuarios (atualizada)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  papel VARCHAR(50) DEFAULT 'usuario',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_papel CHECK (papel IN ('admin', 'gerente', 'operador', 'usuario'))
);

-- Tabela de sessoes/tokens
CREATE TABLE IF NOT EXISTS sessoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  data_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_expiracao TIMESTAMP NOT NULL,
  ativo BOOLEAN DEFAULT true
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  acao VARCHAR(100) NOT NULL,
  tabela VARCHAR(100),
  registro_id INTEGER,
  dados_antigos JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(45),
  data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX idx_sessoes_ativo ON sessoes(ativo);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_data ON auditoria(data_acao);