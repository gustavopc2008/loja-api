-- Schema PostgreSQL (Neon) - Loja Crianças e Cia
-- Execute no Neon Console: https://console.neon.tech

CREATE TABLE IF NOT EXISTS pedidos (
  order_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(100) DEFAULT NULL,
  descricao VARCHAR(255) DEFAULT '',
  subtotal DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  cupom VARCHAR(50) DEFAULT NULL,
  total DECIMAL(10,2) NOT NULL,
  frete DECIMAL(10,2) DEFAULT 0,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50) DEFAULT 'Não informado',
  endereco TEXT,
  itens JSONB,
  preference_id VARCHAR(100) DEFAULT NULL,
  payment_id VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado ON pedidos(criado_em);
