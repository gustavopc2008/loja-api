# Deploy gratuito no Render.com

Backend no Render + banco no **Neon** (PostgreSQL gratuito, **sem cartão de crédito**).

---

## Passo 1: Banco de dados (Neon – 100% grátis)

1. Acesse **https://neon.tech** e crie conta (GitHub ou email).
2. **New Project** → nome: `loja-criancasecia` → região: **South America (São Paulo)**.
3. Depois de criar, vá em **Connection Details**.
4. Copie a **Connection string** (algo como `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`).

### Criar tabelas no Neon

1. No Neon, abra **SQL Editor**.
2. Cole e execute o conteúdo do arquivo `database/schema_neon.sql`:

```sql
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
```

---

## Passo 2: Subir o backend no GitHub

1. Crie um repositório em **https://github.com/new** (ex.: `loja-api`).
2. Na pasta `backend` do seu projeto:

```bash
cd backend
git init
git add .
git commit -m "API Loja"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/loja-api.git
git push -u origin main
```

---

## Passo 3: Deploy no Render

1. Acesse **https://render.com** e crie conta.
2. **New** → **Web Service**.
3. Conecte o repositório do GitHub.
4. Selecione o repositório `loja-api`.
5. Defina:
   - **Name:** `loja-criancasecia-api`
   - **Root Directory:** *(vazio)*
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

6. Em **Environment**, adicione:

| Key | Value |
|-----|-------|
| DATABASE_URL | *(connection string do Neon – marque como Secret)* |
| API_URL | *(preencha depois do deploy, ex: https://loja-criancasecia-api.onrender.com)* |
| STORE_URL | https://xn--crianaecia-s6a.store |
| MP_ACCESS_TOKEN | *(seu token do Mercado Pago – Secret)* |
| CALLMEBOT_PHONE | 5518997365004 |
| CALLMEBOT_TOKEN | *(seu token CallMeBot – Secret)* |

7. Clique em **Create Web Service** e aguarde o deploy.
8. Depois do deploy, copie a URL (ex: `https://loja-criancasecia-api.onrender.com`) e adicione como **API_URL** nas variáveis de ambiente (Environment → Edit).
9. Faça um novo **Manual Deploy** para aplicar a mudança.

---

## Passo 4: Atualizar o site

No `index.html`, ajuste a URL da API:

```html
<script>window.API_BASE = "https://loja-criancasecia-api.onrender.com";</script>
```

Envie o `index.html` atualizado para a pasta `public_html` da Hostinger.

---

## Observação

No plano gratuito do Render, o serviço dorme após ~15 minutos sem acesso. O primeiro acesso após isso pode levar 30–60 segundos para responder.
