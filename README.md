# BAKONGUINHO — Backend Node.js pronto para produção

Este pacote contém o backend Node.js/Express do BAKONGUINHO, preparado para ser hospedado num serviço Node como o Render.

## O que foi preparado

- Node.js + Express
- SQLite com caminho configurável por variável de ambiente
- volume persistente para banco e uploads
- sessões seguras em HTTPS
- `trust proxy` para funcionar atrás do Netlify/Render
- endpoint `/health` para health check
- CORS opcional através de `ALLOWED_ORIGIN`
- uploads persistentes em `/uploads`
- senha do administrador definida por variável de ambiente na primeira instalação
- proteção básica de headers
- frontend continua compatível com `/api/*`

## Deploy recomendado: Render

1. Crie uma conta em https://render.com/
2. Coloque este projeto num repositório GitHub.
3. No Render, crie um Web Service a partir do repositório.
4. Build Command:

```text
npm install
```

5. Start Command:

```text
npm start
```

6. Configure as variáveis:

```text
NODE_ENV=production
SESSION_SECRET=uma-chave-grande-e-aleatoria
ADMIN_EMAIL=admin@bakonguinho.ao
ADMIN_PASSWORD=uma-senha-forte
DATA_DIR=/var/data
DB_PATH=/var/data/bakonguinho.db
UPLOADS_DIR=/var/data/uploads
```

7. Adicione um Persistent Disk montado em `/var/data`.
8. O health check deve ser `/health`.

O endereço final será semelhante a:

```text
https://bakonguinho-api.onrender.com
```

## Ligação com a Netlify

No projeto do frontend, o Netlify deve encaminhar:

```text
/api/*      -> https://SEU-BACKEND.onrender.com/api/:splat
/uploads/*  -> https://SEU-BACKEND.onrender.com/uploads/:splat
```

Assim o frontend continua usando `/api/...` e o navegador mantém a sessão no domínio do site.

## Importante sobre SQLite

SQLite só deve ser usado online com armazenamento persistente. Sem Persistent Disk, uma reinicialização/redeploy pode apagar o banco e os uploads.

## Login inicial

O administrador é criado apenas na primeira execução, usando `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Não use uma senha simples em produção.

## Teste local

```powershell
npm install
$env:ADMIN_PASSWORD="123456"
npm start
```

Abra:

```text
http://localhost:3000
http://localhost:3000/admin
http://localhost:3000/health
```
