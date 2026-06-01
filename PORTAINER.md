# Versão Portainer / Self-Hosted

Esta branch (`portainer`) é a versão do TwixEventos preparada para rodar em
**servidor próprio via Docker/Portainer**, separada da branch `main` (que é a
versão de produção na **Vercel**).

> **Como alternar entre as versões:**
> - `git checkout main`       → versão Vercel (imagens em base64 no Neon)
> - `git checkout portainer`  → versão self-hosted (Docker)

---

## O que difere da `main`

- `next.config.ts` com `output: 'standalone'` (necessário para a imagem Docker)
- **Upload de imagens em pasta** (disco + WebP), em vez de Vercel Blob — ver abaixo
- **Cache imutável** para `/uploads/*` (economia de tráfego) no `next.config.ts`
- `docker-compose.yml`: imagem `:portainer`, monta `init.sql`, expõe
  `NEXT_PUBLIC_SITE_URL` e aguarda o banco (`depends_on`)

A `main` segue otimizada para a **Vercel** (sem standalone, upload via Vercel Blob).

---

## Passo a passo — Deploy no Portainer

> A imagem é publicada em `ghcr.io/danielsjcampos/twixeventos:portainer` pelo
> GitHub Actions a cada push na branch `portainer`. Confirme em **GitHub → Actions**
> que o build terminou antes de subir a stack.

### 1. Acesso ao pacote do GHCR
- Veja em **github.com/Danielsjcampos?tab=packages → twixeventos**.
- Se o pacote for **privado**, cadastre no Portainer um *Registry* com seu usuário
  GitHub + um **Personal Access Token** (escopo `read:packages`).
  (Se torná-lo **público**, o Portainer baixa sem login.)

### 2. Criar a Stack
1. Portainer → **Stacks → Add stack** → nome `twixeventos`.
2. **Build method: Repository** → URL `https://github.com/Danielsjcampos/twixeventos`,
   **branch `portainer`**, compose path `docker-compose.yml`.
   *(ou use "Web editor" e cole o `docker-compose.yml`)*

### 3. Variáveis de ambiente (aba Environment variables)
Baseie-se no `.env.example`:

| Variável | Obrigatória | Exemplo |
|---|---|---|
| `POSTGRES_PASSWORD` | sim | senha forte |
| `NEXT_PUBLIC_SITE_URL` | sim | `https://seusite.com` |
| `NEXTAUTH_URL` | sim | `https://seusite.com` |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | sim | `openssl rand -base64 32` |
| `CRON_SECRET` | sim | `openssl rand -base64 32` |
| `APP_PORT` | não | `3000` |
| `RESEND_API_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER` | conforme uso | |
| `GOOGLE_*`, `GSC_SITE_URL`, `GA4_PROPERTY_ID` | opcional | |

### 4. Deploy
- **Deploy the stack.** O serviço **db** sobe primeiro e, no **1º start**, roda o
  `docker/init.sql` criando as tabelas. O **app** espera o banco ficar saudável
  (`depends_on`) e sobe na porta **3000**.
- Acesse `http://SEU_IP:3000` (ou seu domínio via proxy reverso).

### Atualizar depois de mudanças
```bash
git push           # dispara o build da imagem :portainer no GitHub Actions
# Portainer: Stack → Update the stack → Re-pull image and redeploy
```

### Build/run manual (sem Portainer)
```bash
docker compose up -d --build      # sobe db + app
```

---

## ✅ Upload de imagens em pasta + WebP (implementado)

Diferente da `main` (Vercel Blob), aqui a rota **`app/api/upload/route.ts`**:

1. Recebe o arquivo enviado pelo cliente (`lib/cloudinary/upload.ts`, **sem alteração**).
2. **Converte automaticamente para WebP com `sharp`** (auto-rotate por EXIF,
   redimensiona p/ máx **1400px**, qualidade **80**) — garante WebP mesmo se chegar PNG/JPG.
3. Grava em **`public/uploads/brinquedos/<uuid>.webp`** (volume Docker persistente).
4. Retorna `{ url: "/uploads/brinquedos/<uuid>.webp" }` — o banco guarda só o caminho.

**Economia de tráfego:**
- WebP + dimensão limitada → arquivos pequenos.
- `next.config.ts` envia `Cache-Control: public, max-age=31536000, immutable` para
  `/uploads/*` → o browser/CDN não rebaixa a mesma imagem (nomes são únicos/uuid).

**Infra:**
- Volume `twix_uploads:/app/public/uploads` no compose — **sem ele as imagens somem**
  no redeploy.
- `.gitignore` já ignora `/public/uploads/` (as imagens vivem no volume, não no git).

> **Backup tem 2 partes:** o dump do Postgres **e** o volume `twix_uploads`.
