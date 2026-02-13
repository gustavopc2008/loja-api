-- ===========================================
-- Schema MySQL - Loja Crianças e Cia (Hostinger)
-- ===========================================
-- 1. Selecione o banco u183285674_FernandaGu no phpMyAdmin
-- 2. Vá na aba SQL e cole/importe este arquivo

-- Tabela de pedidos
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
  itens JSON,
  preference_id VARCHAR(100) DEFAULT NULL,
  payment_id VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de produtos (opcional - para controle de estoque)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Índices para buscas
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_criado ON pedidos(criado_em);
