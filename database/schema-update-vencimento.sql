-- Adiciona coluna de data de validade aos produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS data_validade DATE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS lote VARCHAR(100);

-- Nova tabela para rastrear avisos enviados
CREATE TABLE IF NOT EXISTS avisos_vencimento (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  email VARCHAR(255) NOT NULL,
  data_validade DATE NOT NULL,
  dias_para_vencer INTEGER,
  status VARCHAR(50) DEFAULT 'enviado',
  data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_vencimento_real TIMESTAMP
);

-- Índice para melhor performance
CREATE INDEX idx_avisos_data_envio ON avisos_vencimento(data_envio);
CREATE INDEX idx_produtos_data_validade ON produtos(data_validade);