-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  ativa BOOLEAN DEFAULT true,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de preco por fornecedor
CREATE TABLE IF NOT EXISTS preco_fornecedor (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
  fornecedor_id INTEGER REFERENCES fornecedores(id) ON DELETE CASCADE,
  preco DECIMAL(10, 2) NOT NULL,
  quantidade_minima INTEGER DEFAULT 1,
  tempo_entrega INTEGER,
  ativo BOOLEAN DEFAULT true,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(produto_id, fornecedor_id)
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  fornecedor_id INTEGER REFERENCES fornecedores(id),
  data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_entrega TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pendente',
  total DECIMAL(12, 2),
  observacoes TEXT,
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_pedido CHECK (status IN ('pendente', 'confirmado', 'em_transito', 'entregue', 'cancelado'))
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id),
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL
);

-- Indices
CREATE INDEX idx_categorias_nome ON categorias(nome);
CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_fornecedor ON pedidos(fornecedor_id);
CREATE INDEX idx_preco_fornecedor_produto ON preco_fornecedor(produto_id);
CREATE INDEX idx_pedido_itens_pedido ON pedido_itens(pedido_id);