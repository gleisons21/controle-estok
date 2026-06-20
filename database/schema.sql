-- Banco de dados para Controle de Estoque

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  papel VARCHAR(50) DEFAULT 'usuario',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  sku VARCHAR(100) UNIQUE NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id),
  preco_custo DECIMAL(10, 2),
  preco_venda DECIMAL(10, 2),
  quantidade_minima INTEGER DEFAULT 10,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estoque (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id),
  quantidade INTEGER DEFAULT 0,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id),
  tipo VARCHAR(50),
  quantidade INTEGER,
  usuario_id INTEGER REFERENCES usuarios(id),
  motivo TEXT,
  data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_estoque_produto ON estoque(produto_id);
CREATE INDEX idx_movimentacoes_produto ON movimentacoes(produto_id);
CREATE INDEX idx_movimentacoes_usuario ON movimentacoes(usuario_id);