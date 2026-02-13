# API Loja Crianças e Cia - Deploy VPS Hostinger

Backend Node.js para substituir Firebase Cloud Functions. Roda na sua VPS Hostinger.

## Pré-requisitos

- VPS Hostinger com Node.js 18+
- MySQL (phpMyAdmin no painel Hostinger)
- Domínio apontando para o IP da VPS (ex: xn--crianaecia-s6a.store)

## 1. Criar banco MySQL

1. Acesse o **hPanel** da Hostinger
2. Abra **Bancos de dados MySQL** → **phpMyAdmin**
3. Crie um banco chamado `loja_criancasecia`
4. Importe o arquivo `database/schema.sql` ou execute o SQL manualmente

## 2. Configurar variáveis de ambiente

```bash
cd backend
cp .env.example .env
nano .env   # ou use o editor que preferir
```

Preencha no `.env`:

- `BASE_URL` = https://xn--crianaecia-s6a.store (seu domínio)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` = dados do MySQL da Hostinger
- `MP_ACCESS_TOKEN` = token do Mercado Pago
- `CALLMEBOT_PHONE` e `CALLMEBOT_TOKEN` = dados do CallMeBot

## 3. Instalar dependências e testar

```bash
cd backend
npm install
npm start
```

A API deve rodar em `http://localhost:3000`. Teste: `curl http://localhost:3000/health`

## 4. Rodar em produção (PM2)

```bash
npm install -g pm2
pm2 start server.js --name loja-api
pm2 save
pm2 startup   # segue as instruções para iniciar no boot
```

## 5. Configurar Nginx

No painel Hostinger ou via SSH, edite o Nginx para o seu site. Adicione dentro do `server { ... }`:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Isso faz com que:
- `https://xn--crianaecia-s6a.store/api/mpCriaPreferencia` → Node.js na porta 3000
- `https://xn--crianaecia-s6a.store/api/whatsappNotification` → Webhook do Mercado Pago
- `https://xn--crianaecia-s6a.store/api/enviarEncomenda` → Formulário de encomendas

## 6. Configurar Mercado Pago

No painel do Mercado Pago, o webhook será chamado automaticamente em:
`https://xn--crianaecia-s6a.store/api/whatsappNotification`

Não é necessário configurar manualmente se a `notification_url` estiver correta no código (usa `BASE_URL`).

## 7. Frontend (index.html)

O `index.html` já está configurado com `window.API_BASE = "https://xn--crianaecia-s6a.store"`.
Se o site estiver em outro domínio, altere essa variável no topo do arquivo.

## Estrutura de pastas no servidor

```
/var/www/seu-dominio/
├── index.html
├── sucesso.html
├── erro.html
├── pendente.html
├── Produtos/
├── Static/
└── backend/
    ├── server.js
    ├── package.json
    ├── .env
    └── node_modules/
```

O Nginx deve servir os arquivos HTML na raiz e fazer proxy de `/api/` para o backend.

## Comandos úteis

```bash
pm2 logs loja-api      # ver logs
pm2 restart loja-api   # reiniciar
pm2 stop loja-api      # parar
```
