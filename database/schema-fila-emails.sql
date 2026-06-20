-- Tabela para fila de emails
CREATE TABLE IF NOT EXISTS fila_emails (
  id SERIAL PRIMARY KEY,
  destinatario VARCHAR(255) NOT NULL,
  assunto VARCHAR(255) NOT NULL,
  corpo_html TEXT NOT NULL,
  tipo VARCHAR(50),
  referencia_id INTEGER,
  status VARCHAR(50) DEFAULT 'pendente',
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  proxima_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  erro_mensagem TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  enviado_em TIMESTAMP,
  CONSTRAINT fk_status CHECK (status IN ('pendente', 'enviando', 'enviado', 'erro', 'falha_permanente'))
);

-- Tabela para log de envio
CREATE TABLE IF NOT EXISTS log_emails (
  id SERIAL PRIMARY KEY,
  fila_email_id INTEGER REFERENCES fila_emails(id),
  destinatario VARCHAR(255) NOT NULL,
  assunto VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  codigo_erro VARCHAR(50),
  mensagem_erro TEXT,
  tentativa_numero INTEGER,
  enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_fila_status ON fila_emails(status);
CREATE INDEX idx_fila_proxima_tentativa ON fila_emails(proxima_tentativa);
CREATE INDEX idx_log_emails_criado ON log_emails(enviado_em);
CREATE INDEX idx_fila_tipo ON fila_emails(tipo);