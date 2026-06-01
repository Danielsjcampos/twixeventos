# Versão Portainer / Self-Hosted

Esta branch (`portainer`) é a versão do TwixEventos preparada para rodar em
**servidor próprio via Docker/Portainer**, separada da branch `main` (que é a
versão de produção na **Vercel**).

> **Como alternar entre as versões:**
> - `git checkout main`       → versão Vercel (imagens em base64 no Neon)
> - `git checkout portainer`  → versão self-hosted (Docker)

---

## O que esta branch tem a mais que a `main`

- `Dockerfile` — build multi-stage (Node 22 alpine, output `standalone`)
- `docker-compose.yml` — sobe o app (e, opcionalmente, um Postgres local)
- `.dockerignore`
- `next.config.ts` já com `output: 'standalone'` (necessário para o Docker)

A branch `main` continua **sem** esses arquivos, limpa para a Vercel.

---

## Deploy no Portainer

1. No Portainer: **Stacks → Add stack**.
2. Aponte o repositório Git para esta branch (`portainer`) ou cole o conteúdo
   do `docker-compose.yml`.
3. Configure as variáveis de ambiente (veja `.env.example`):
   `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, e as do Google (opcionais).
4. Deploy. O app sobe na porta **3000**.

### Build/run manual (sem Portainer)
```bash
docker build -t twixeventos .
docker run -p 3000:3000 --env-file .env.local twixeventos
# ou
docker compose up -d --build
```

---

## ⚠️ Upload de imagens em pasta (a fazer)

A versão atual ainda usa o padrão **base64 no banco** (igual à `main`). Para
aproveitar o disco persistente do servidor e guardar as imagens como **arquivos
numa pasta**, será necessário:

1. Trocar a função de upload (de "gera base64" para "salva arquivo → retorna caminho").
2. Criar uma rota de upload no servidor.
3. Mudar a coluna do banco para guardar o **caminho** em vez do base64.
4. **Adicionar um volume persistente** no `docker-compose.yml` para a pasta de
   uploads — sem isso, as imagens somem a cada redeploy do container:
   ```yaml
   volumes:
     - twix_uploads:/app/uploads
   # ...
   volumes:
     twix_uploads:
   ```

> Lembre-se: com upload em pasta, o **backup tem 2 partes** — o dump do Postgres
> **e** a pasta de uploads (na `main`/base64, o backup do banco já leva tudo).
