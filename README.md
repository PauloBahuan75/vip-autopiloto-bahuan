# VIP Autopiloto - Bahuan Imóveis (SP)

Projeto pronto para captar leads qualificados de imóveis em São Paulo (Morumbi, Santo Amaro, Butantã, Vila Sônia e Vila Andrade), classificar automaticamente e levar o contato para WhatsApp.

## Estrutura

- `index.html`: home com proposta + CTA.
- `vip/index.html`: formulário Lista VIP.
- `w/index.html`: registra origem (`?src=`) e redireciona para WhatsApp com mensagem pronta.
- `seo/*.html`: 10 páginas locais com conteúdo útil e CTA.
- `assets/js/config.js`: configurações de WhatsApp e URL do Apps Script.
- `apps-script/Code.gs`: captura de dados, score e relatórios.

## 1) Publicar o site grátis

### Opção A: GitHub Pages
1. Suba este projeto para um repositório no GitHub.
2. Vá em **Settings > Pages**.
3. Em **Source**, selecione branch (`main`/`master`) e pasta `/root`.
4. Salve e aguarde URL pública.

### Opção B: Cloudflare Pages
1. Acesse Cloudflare Pages e conecte o repositório.
2. Framework preset: **None**.
3. Build command: vazio.
4. Output directory: `/`.
5. Deploy.

## 2) Criar planilha + Apps Script

1. Abra Google Sheets e crie a planilha `VIP Autopiloto Bahuan`.
2. Vá em **Extensões > Apps Script**.
3. Apague o conteúdo e cole `apps-script/Code.gs`.
4. Em `appsscript.json`, copie o conteúdo de `apps-script/appsscript.json`.
5. Salve.
6. Execute a função `setupSheets_` (ou `doPost` via teste) para criar abas:
   - `Leads`
   - `WA_Clicks`
   - `Config`
7. Na aba `Config`, ajuste `EMAIL_RELATORIO`.

## 3) Publicar Apps Script como Web App

1. Em Apps Script: **Deploy > New deployment**.
2. Tipo: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone** (ou Anyone with link).
5. Deploy e copie a URL do Web App.

## 4) Ligar o Web App no site

1. Abra `assets/js/config.js`.
2. Troque:

```js
scriptWebAppUrl: 'COLE_AQUI_URL_DO_WEBAPP'
```

por:

```js
scriptWebAppUrl: 'https://script.google.com/macros/s/SEU_ID/exec'
```

3. Garanta que `whatsappNumber` esteja `5511996900033`.
4. Publique novamente o site.

## 5) Ativar automações de relatório

1. No Apps Script, execute manualmente `installTriggers` uma vez.
2. Isso criará:
   - relatório diário às **20:30** (`America/Sao_Paulo`) via `sendDailyReport`.
   - relatório final a cada 14 dias via `sendFinal14DaysReport`.

## Lógica de score (0 a 100)

O score é calculado com base em:
- prazo de compra (peso maior),
- faixa de entrada,
- tipo de imóvel,
- aderência aos bairros foco.

Classificação:
- **QUENTE**: `>= 75`
- **MORNO**: `45 a 74`
- **FRIO**: `< 45`

## Mensagem padrão enviada ao WhatsApp

A página `/w` gera automaticamente:

```text
Olá! Vim pela Lista VIP (SRC: {src}). Busco {tipo} em {bairro}, entrada {entrada}, prazo {prazo}.
```

## Checklist de testes (end-to-end) em 15 minutos

### Bloco 1 — Site (5 min)
- [ ] Abrir home e clicar em **Entrar na Lista VIP**.
- [ ] Validar se formulário exige campos obrigatórios.
- [ ] Enviar formulário e confirmar redirecionamento para `/w` e depois `wa.me`.

### Bloco 2 — Tracking + Planilha (5 min)
- [ ] Testar URL com origem: `/vip/?src=campanha-meta`.
- [ ] Concluir envio.
- [ ] Verificar nova linha na aba `Leads` com `SRC=campanha-meta`, `Score` e `Status`.
- [ ] Verificar nova linha em `WA_Clicks`.

### Bloco 3 — Relatórios (5 min)
- [ ] Rodar `sendDailyReport` manualmente e validar recebimento por e-mail.
- [ ] Rodar `sendFinal14DaysReport` manualmente e validar recomendações.
- [ ] Rodar `installTriggers` e confirmar gatilhos criados.

## Observações de compliance

- Este projeto **não** contém automação de spam em redes sociais.
- Fluxo focado em inbound: formulário, conteúdo local útil e atendimento consultivo no WhatsApp.
