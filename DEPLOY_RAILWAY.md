# Deploy gratuito no Railway.app

O Railway permite **chamadas de saída a APIs externas** (como Mercado Pago) no plano gratuito, ao contrário do Render free tier que pode bloquear conexões.

---

## Passo 1: Criar conta no Railway

1. Acesse **https://railway.app** e crie conta (GitHub ou email).
2. O plano gratuito dá ~$5/mês em créditos — suficiente para APIs leves.

---

## Passo 2: Novo projeto

1. Clique em **New Project**.
2. Escolha **Deploy from GitHub repo**.
3. Conecte sua conta GitHub se ainda não estiver conectada.
4. Selecione o repositório onde está o backend:
   - Se o backend está em **`d:\Projetos\Loja_Fer\backend`** e você faz push da pasta `backend` em um repo separado (ex: `loja-api`), selecione esse repo.
   - Se o projeto inteiro (`Loja_Fer`) está em um repo, selecione esse repo e depois defina **Root Directory** (veja Passo 4).

---

## Passo 3: Adicionar PostgreSQL (ou usar Neon)

### Opção A: PostgreSQL do Railway (mais simples)

1. No projeto Railway, clique em **+ New** → **Database** → **PostgreSQL**.
2. Aguarde o deploy do banco.
3. Na aba **Variables** do banco, copie a variável `DATABASE_URL`.
4. Você usará essa URL no serviço da API.

### Opção B: Continuar usando Neon

1. Use a mesma **Connection string** do Neon que você já tem.
2. Em formato: `postgresql://user:pass@host/db?sslmode=require`.

---

## Passo 4: Configurar o serviço da API

1. Clique no **serviço da API** (não no banco).
2. Vá em **Settings**:
   - **Root Directory:** se o backend está em uma subpasta `backend`, defina `backend`. Se o repo é só o backend, deixe vazio.
   - **Build Command:** `npm install` (ou deixe em branco para padrão).
   - **Start Command:** `npm start` (ou deixe em branco).

3. Vá em **Variables** e adicione:

| Variável         | Valor                                                                 |
|------------------|-----------------------------------------------------------------------|
| DATABASE_URL     | `${{Postgres.DATABASE_URL}}` (se usar Postgres do Railway) ou a connection string do Neon |
| STORE_URL        | `https://xn--crianaecia-s6a.store` (ou o domínio do seu site)         |
| API_URL          | *(deixe em branco por enquanto; preencha depois de gerar o domínio)*  |
| MP_ACCESS_TOKEN  | *(seu Access Token do Mercado Pago)*                                  |
| CALLMEBOT_PHONE  | `5518997365004`                                                       |
| CALLMEBOT_TOKEN  | *(seu token CallMeBot)*                                               |
| PORT             | *(não defina — o Railway define automaticamente)*                     |

---

## Passo 5: Gerar domínio público

1. No serviço da API, vá em **Settings** → **Networking**.
2. Clique em **Generate Domain**.
3. Copie a URL gerada (ex: `https://loja-api-production-xxxx.up.railway.app`).
4. Volte em **Variables** e adicione/edite:
   - **API_URL** = a URL que você copiou (ex: `https://loja-api-production-xxxx.up.railway.app`).

---

## Passo 6: Criar tabelas no banco

Se você usar **PostgreSQL do Railway** (novo banco):

1. No Railway, abra o serviço PostgreSQL.
2. Vá em **Data** ou use **Query** e execute o conteúdo de `database/schema_neon.sql`:

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

Se usar **Neon**, as tabelas já devem existir.

---

## Passo 7: Atualizar o site (index.html)

No `index.html` do seu site, altere a URL da API:

```html
<script>
  window.API_BASE = "https://SUA-URL-RAILWAY.up.railway.app";
</script>
```

Substitua `SUA-URL-RAILWAY` pela URL gerada no Passo 5.

---

## Passo 8: CORS

O `server.js` já aceita origens dinâmicas. Se o site estiver em outro domínio, adicione-o na lista `ALLOWED_ORIGINS` no código ou garanta que a origem do site esteja permitida.

---

## Resumo rápido

1. **Railway** → New Project → Deploy from GitHub.
2. Adicione **PostgreSQL** (ou use Neon).
3. Configure **Variables** (DATABASE_URL, MP_ACCESS_TOKEN, etc.).
4. **Generate Domain** no serviço da API.
5. Preencha **API_URL** com o domínio gerado.
6. Crie as tabelas no banco (se novo).
7. Atualize `window.API_BASE` no `index.html` do site.

O Railway permite tráfego de saída HTTPS para APIs externas como o Mercado Pago, o que deve resolver o erro `ECONNREFUSED` que você tinha no Render.
