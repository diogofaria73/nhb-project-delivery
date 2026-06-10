# Deploy do NHB Status Report em Azure

Guia operacional para publicar a aplicação em Azure usando **Container Apps**, **Azure Database for PostgreSQL Flexible Server** e **Azure Blob Storage**. A imagem Docker é única (API + Web buildada e servida pela própria API).

> Todos os comandos `az` abaixo assumem que você já fez `az login` e tem permissão de **Contributor** na assinatura/resource group de destino.

---

## Arquitetura

```
                ┌───────────────────────────────────────────────┐
                │           Browser do usuário                  │
                └────────────────────┬──────────────────────────┘
                                     │ HTTPS
                                     ▼
       ┌─────────────────────────────────────────────────────┐
       │  Azure Container Apps (ingress externo, HTTPS auto) │
       │  └─ nhb-app  (imagem ACR: API serve Web /dist)      │
       └────────┬───────────────────────────┬────────────────┘
                │ TCP 5432                  │ HTTPS
                ▼                           ▼
   ┌──────────────────────────┐  ┌──────────────────────────┐
   │  Azure Database for      │  │  Azure Blob Storage      │
   │  PostgreSQL Flexible Srv │  │  (container "status-     │
   │  (B1ms, public access)   │  │  reports", anexos)       │
   └──────────────────────────┘  └──────────────────────────┘
```

---

## Pré-requisitos

- **Azure CLI** ≥ 2.60 (`az --version`)
- Assinatura ativa (`az account show`)
- Permissão de Contributor + User Access Administrator no Resource Group de destino
- Docker local (para build e push, ou use ACR Tasks)
- (Opcional) Postgres client (`psql`) para validar conexão

---

## Variáveis padrão (ajuste antes de copiar)

```bash
# Identifiers ─ ajuste!
export AZ_LOCATION="brazilsouth"
export AZ_RG="nhb-rg"
export AZ_ACR="nhbacr$RANDOM"        # nome global, sem hífen, minúsculas
export AZ_PG_SERVER="nhb-pg-$RANDOM"
export AZ_PG_ADMIN="nhbadmin"
export AZ_PG_PASSWORD="$(openssl rand -base64 24)"   # GUARDE
export AZ_PG_DB="nhb_status_report"
export AZ_STORAGE="nhbstorage$RANDOM"
export AZ_STORAGE_CONTAINER="status-reports"
export AZ_CAE="nhb-cae"              # Container Apps Environment
export AZ_APP="nhb-app"
export AZ_LOGS="nhb-logs"

# App secrets ─ gere fortes
export NHB_JWT_SECRET="$(openssl rand -base64 64)"
```

---

## 1. Resource group + Log Analytics

```bash
az group create --name $AZ_RG --location $AZ_LOCATION

az monitor log-analytics workspace create \
  --resource-group $AZ_RG \
  --workspace-name $AZ_LOGS \
  --location $AZ_LOCATION

LOG_WORKSPACE_ID=$(az monitor log-analytics workspace show -g $AZ_RG -n $AZ_LOGS --query customerId -o tsv)
LOG_WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys -g $AZ_RG -n $AZ_LOGS --query primarySharedKey -o tsv)
```

## 2. Azure Database for PostgreSQL Flexible Server

```bash
az postgres flexible-server create \
  --resource-group $AZ_RG \
  --name $AZ_PG_SERVER \
  --location $AZ_LOCATION \
  --tier Burstable --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 16 \
  --admin-user $AZ_PG_ADMIN \
  --admin-password "$AZ_PG_PASSWORD" \
  --public-access 0.0.0.0 \
  --yes

az postgres flexible-server db create \
  --resource-group $AZ_RG \
  --server-name $AZ_PG_SERVER \
  --database-name $AZ_PG_DB
```

Habilite o acesso público (mais simples para começar — restrinja depois com VNet integration ou private endpoint).

Monte a `DATABASE_URL`:

```bash
export PG_HOST="${AZ_PG_SERVER}.postgres.database.azure.com"
export DATABASE_URL="postgresql://${AZ_PG_ADMIN}:${AZ_PG_PASSWORD}@${PG_HOST}:5432/${AZ_PG_DB}?sslmode=require"
```

## 3. Storage Account + Blob container

```bash
az storage account create \
  --resource-group $AZ_RG \
  --name $AZ_STORAGE \
  --location $AZ_LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access false

export AZ_STORAGE_CONNSTR=$(az storage account show-connection-string \
  --resource-group $AZ_RG --name $AZ_STORAGE --query connectionString -o tsv)

az storage container create \
  --name $AZ_STORAGE_CONTAINER \
  --connection-string "$AZ_STORAGE_CONNSTR" \
  --public-access off
```

## 4. Azure Container Registry + push da imagem

```bash
az acr create \
  --resource-group $AZ_RG \
  --name $AZ_ACR \
  --sku Basic \
  --admin-enabled true

# Build + push (no diretório raiz do repositório)
az acr build \
  --registry $AZ_ACR \
  --image nhb-app:v1 \
  --file Dockerfile .

# Capture credenciais para o Container App
export ACR_LOGIN_SERVER="${AZ_ACR}.azurecr.io"
export ACR_USERNAME=$(az acr credential show -n $AZ_ACR --query username -o tsv)
export ACR_PASSWORD=$(az acr credential show -n $AZ_ACR --query "passwords[0].value" -o tsv)
```

> Alternativa: `docker build -t nhb-app:v1 . && az acr login -n $AZ_ACR && docker tag nhb-app:v1 ${ACR_LOGIN_SERVER}/nhb-app:v1 && docker push ${ACR_LOGIN_SERVER}/nhb-app:v1`

## 5. Container Apps Environment

```bash
az extension add --name containerapp --upgrade

az containerapp env create \
  --resource-group $AZ_RG \
  --name $AZ_CAE \
  --location $AZ_LOCATION \
  --logs-workspace-id $LOG_WORKSPACE_ID \
  --logs-workspace-key $LOG_WORKSPACE_KEY
```

## 6. Container App (deploy inicial)

```bash
# Defina o CORS_ORIGIN — será o seu próprio FQDN.
# Como ainda não existe, criamos sem ele e atualizamos depois.

az containerapp create \
  --name $AZ_APP \
  --resource-group $AZ_RG \
  --environment $AZ_CAE \
  --image ${ACR_LOGIN_SERVER}/nhb-app:v1 \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 --max-replicas 3 \
  --cpu 0.5 --memory 1.0Gi \
  --secrets \
      database-url="$DATABASE_URL" \
      jwt-secret="$NHB_JWT_SECRET" \
      storage-conn="$AZ_STORAGE_CONNSTR" \
  --env-vars \
      NODE_ENV=production \
      PORT=3000 \
      DATABASE_URL=secretref:database-url \
      JWT_SECRET=secretref:jwt-secret \
      JWT_EXPIRATION=28800 \
      STORAGE_DRIVER=azure-blob \
      AZURE_STORAGE_CONNECTION_STRING=secretref:storage-conn \
      AZURE_STORAGE_CONTAINER=$AZ_STORAGE_CONTAINER

# Capture o FQDN e atualize o CORS_ORIGIN (mesmo domínio porque API + Web são same-origin)
export APP_FQDN=$(az containerapp show -n $AZ_APP -g $AZ_RG --query properties.configuration.ingress.fqdn -o tsv)
echo "App URL: https://$APP_FQDN"

az containerapp update \
  --name $AZ_APP --resource-group $AZ_RG \
  --set-env-vars CORS_ORIGIN="https://$APP_FQDN"
```

---

## Verificação pós-deploy

1. **Health check:** `curl -i https://$APP_FQDN/api` → deve retornar 404 (rota não existe mas o servidor responde). Se voltar 502, o container caiu — veja os logs.
2. **Swagger:** em prod o Swagger está desligado (intencional). Para validar a API: `curl -i -X POST https://$APP_FQDN/api/auth/login -H 'content-type: application/json' -d '{"email":"admin@platform.com","password":"Admin@123"}'`
3. **Frontend:** abra `https://$APP_FQDN` no navegador — deve carregar a tela de login.
4. **Trocar a senha do admin imediatamente** (item M1 do audit de segurança).

### Logs em tempo real

```bash
az containerapp logs show -n $AZ_APP -g $AZ_RG --follow
```

### Reiniciar (rolling restart)

```bash
az containerapp revision restart -n $AZ_APP -g $AZ_RG \
  --revision $(az containerapp revision list -n $AZ_APP -g $AZ_RG --query "[0].name" -o tsv)
```

---

## Deploy de novas versões

```bash
# 1. Build da nova imagem
az acr build --registry $AZ_ACR --image nhb-app:v2 --file Dockerfile .

# 2. Atualize o Container App (cria nova revision, mantém a anterior por rollback)
az containerapp update \
  --name $AZ_APP --resource-group $AZ_RG \
  --image ${ACR_LOGIN_SERVER}/nhb-app:v2
```

### Rollback

```bash
# Liste revisions
az containerapp revision list -n $AZ_APP -g $AZ_RG --query "[].{name:name, active:properties.active, created:properties.createdTime}" -o table

# Reative a revision anterior
az containerapp revision activate -n $AZ_APP -g $AZ_RG --revision <nome-da-revision>
```

---

## Custo estimado (tier mais baixo, tráfego baixo)

| Recurso | SKU | ~USD/mês |
| --- | --- | --- |
| Container App | Consumption 0.5 vCPU / 1 GiB, 1 réplica mínima | $10–15 |
| PostgreSQL Flexible | Burstable B1ms + 32 GB storage | $15–20 |
| Storage Account | Standard_LRS, < 1 GB | $0.50 |
| Container Registry | Basic | $5 |
| Log Analytics | Pay-as-you-go (baixo volume) | $2–5 |
| **Total** | | **~$35–45** |

Para reduzir mais, escale a Container App para `min-replicas=0` (cold start de 1–2s no primeiro request).

---

## Variáveis de ambiente exigidas em produção

| Variável | Origem | Notas |
| --- | --- | --- |
| `NODE_ENV` | `production` | hardcoded no env |
| `PORT` | `3000` | exposto no container, ingress aponta pra cá |
| `DATABASE_URL` | secret | `?sslmode=require` obrigatório |
| `JWT_SECRET` | secret | ≥ 32 bytes aleatórios. **NÃO pode** começar com `nhb-dev-` (o bootstrap falha) |
| `JWT_EXPIRATION` | `28800` (8h) | reduzir para 1800 (30min) quando A1 do audit for fechado |
| `CORS_ORIGIN` | FQDN da app | obrigatório em prod (bootstrap valida) |
| `STORAGE_DRIVER` | `azure-blob` | sem isso, cai no LocalDiskStorage |
| `AZURE_STORAGE_CONNECTION_STRING` | secret | string completa do storage account |
| `AZURE_STORAGE_CONTAINER` | `status-reports` | nome do container Blob |

---

## CI/CD (sugestão: GitHub Actions)

Esqueleto mínimo (não incluído no repo ainda):

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - run: az acr build --registry ${{ secrets.AZ_ACR }} --image nhb-app:${{ github.sha }} --file Dockerfile .
      - run: |
          az containerapp update \
            --name ${{ secrets.AZ_APP }} --resource-group ${{ secrets.AZ_RG }} \
            --image ${{ secrets.AZ_ACR }}.azurecr.io/nhb-app:${{ github.sha }}
```

Crie o secret `AZURE_CREDENTIALS` com `az ad sp create-for-rbac --name nhb-deployer --role contributor --scopes /subscriptions/<id>/resourceGroups/$AZ_RG --sdk-auth`.

---

## Troubleshooting

| Sintoma | Possível causa | Ação |
| --- | --- | --- |
| 502 logo após deploy | Container crash no startup (JWT_SECRET ausente/dev, CORS_ORIGIN ausente) | `az containerapp logs show -n $AZ_APP -g $AZ_RG --tail 200` — procurar a Error message do bootstrap |
| Migrations não aplicaram | Postgres firewall bloqueia o IP do Container App | Verifique a regra "Allow public access from any Azure service" no postgres |
| `Failed to fetch` no browser, mas API responde no curl | `CORS_ORIGIN` errado (mismatch http/https ou trailing slash) | Atualize `CORS_ORIGIN` e reinicie |
| Upload de anexo falha com 500 | Connection string do storage inválida ou container Blob não existe | Recrie o container Blob e verifique a secret |
| Login funciona mas refresh da página dá 404 | ServeStatic SPA fallback não está habilitado | Confirme que `WEB_BUILD_PATH` aponta para um diretório válido no container |

---

## Próximos passos recomendados

1. Aplicar **Sprint 1** do `docs/security-audit.md` (helmet, swagger gating e CORS validation já estão neste deploy; faltam C1, C2, C3)
2. Configurar **custom domain** + certificado managed no Container Apps
3. **Private endpoint** no Postgres + VNet integration (eliminar acesso público)
4. **Managed identity** para Storage Account (eliminar connection string)
5. CI/CD com GitHub Actions
6. **Backup retention** do Postgres ≥ 7 dias (default Flexible Server é 7)
