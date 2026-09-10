# HiFi Platform — Relatório de Auditoria de Segurança & Arquitetura
**Padrão Metodológico**: 007 Chief Security Architect AI (STRIDE + PASTA + OWASP)  
**Data da Auditoria**: 10 de Setembro de 2026  
**Escopo do Sistema**: Next.js Web App & Backend APIs (`src/`), 3 Aplicações Móveis React Native / Expo (`hifi-mobile`, `hifi-mobile-admin`, `hifi-mobile-shop`), Supabase Database & Migrations (`supabase/`), Políticas de RLS, Infraestrutura & Segredos (`.env`, `.env.local`, `.github/workflows/ci.yml`).  
**Classificação do Documento**: CONFIDENCIAL / AUDITORIA INTERNA  

---

## 1. Resumo Do Sistema

### 1.1 Contexto de Negócio e Arquitetura Geral
A plataforma **HiFi** é um ecossistema de e-commerce e customização de vestuário/produtos (impressão sob demanda e designs personalizados). O ecossistema foi projetado para gerenciar o catálogo de produtos, customizações de design pelos clientes, processamento de pagamentos via gateway bancário, logística de entrega, faturamento, notificações transacionais automatizadas via WhatsApp e painéis administrativos para operadores de loja e parceiros comerciais.

O ecossistema é composto por quatro camadas operacionais interligadas:
1. **Next.js Web Application & API Backend (`/home/guru/hifi/src`)**:
   - Aplicação web híbrida (App Router) construída com Next.js 16.3.3 e React 19.2.8.
   - Provê tanto as interfaces de usuário para clientes e administradores (`src/app/`), quanto 28 API route handlers (`src/app/api/`) responsáveis por catálogo, carrinho, checkout, webhook do WhatsApp, sincronização de autenticação, relatórios, faturamento e tarefas cron agendadas.
2. **Aplicações Móveis React Native / Expo**:
   - `hifi-mobile`: Diretório reservado para a aplicação de compras dos clientes consumidores (atualmente encontrado como diretório vazio de 0 arquivos).
   - `hifi-mobile-admin`: Aplicação móvel para administração e gestão de operações da loja (gerenciamento de pedidos, inventário e visão executiva de vendas).
   - `hifi-mobile-shop`: Aplicação móvel para lojistas e clientes (navegação de catálogo, carrinho de compras, integração de checkout Razorpay nativo e perfil de usuário).
3. **Camada de Dados, Autenticação e Storage (Supabase & Firebase)**:
   - Banco de dados relacional PostgreSQL gerenciado no Supabase com 17 scripts de migração de esquema (`supabase/migrations/00001` a `00016`).
   - Autenticação de usuários baseada em Firebase Authentication (`firebase: ^12.18.0`, `firebase-admin: ^13.10.0`), integrada ao Supabase através de endpoints de sincronização de perfil (`/api/auth/sync`).
   - Supabase Storage Buckets para armazenamento de fotos de produtos (`products`) e artes de customização dos clientes (`designs`).
4. **Integrações de Terceiros e Infraestrutura**:
   - **Gateway de Pagamento**: Razorpay SDK (`razorpay: ^2.9.8`) e Razorpay Checkout nativo para liquidação de transações.
   - **Comunicação Transacional**: WhatsApp Meta Graph API / Maghgo Marketplace Webhooks para envio de confirmações de pedidos e alertas a administradores.
   - **Hospedagem & CI/CD**: Vercel (definições de crons em `vercel.json`) e GitHub Actions (`.github/workflows/ci.yml`).

### 1.2 Inventário de Componentes e Dependências Críticas

| Componente | Tecnologia / Versão | Função Principal | Ponto de Risco Primário |
|---|---|---|---|
| **Web Frontend** | Next.js 16.3.3, TailwindCSS | Catálogo, checkout, dashboards admin | Ausência de cabeçalhos de segurança, rotas admin desprotegidas |
| **Backend APIs** | Next.js Route Handlers | Processamento de pedidos, pagamentos, crons | Bypass de RLS com Service Role, autenticação estática |
| **Mobile Admin** | Expo 52, React Native 0.76 | Painel administrativo móvel | Ausência total de login e controles de acesso |
| **Mobile Shop** | Expo 52, React Native 0.76 | Navegação de produtos, carrinho e checkout | Tráfego HTTP em texto claro, persistência de sessão volátil |
| **Banco de Dados** | Supabase PostgreSQL 15 | Persistência relacional e RLS | RLS universalmente ignorado via Service Role Key |
| **Storage** | Supabase Storage | Armazenamento de artes e imagens | Bucket privado acessado via URL pública, uploads sem filtro |
| **Autenticação** | Firebase Auth / Admin SDK | Emissão de tokens JWT para clientes | Account linking sem verificação de email |
| **Pagamentos** | Razorpay SDK | Cobrança PIX / Cartões / UPI | Verificação de pagamento vulnerável a substituição de pedido |
| **Mensageria** | WhatsApp Meta API / Maghgo | Mensagens transacionais | Token de bot vazado em resposta de erro HTTP 401 |

---

## 2. Mapa De Ataque

A superfície de ataque do ecossistema HiFi foi mapeada analisando-se os fluxos de entrada e saída de dados, trust boundaries, ativos críticos e vetores de execução de código.

```
                      [ ATACANTE EXTERNO / CLIENTE ]
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │ (1) Cookie admin_token      │ (2) Requisições API        │ (3) Deep Link hifi-admin://
       ▼                            ▼                            ▼
┌──────────────────┐      ┌─────────────────────┐      ┌─────────────────────────┐
│ Next.js Web App  │      │ Next.js API Routes  │      │ Expo Mobile Admin App   │
│ (src/app/admin/*)│      │ (src/app/api/*)     │      │ (hifi-mobile-admin)     │
│ [proxy.ts MORTO] │      │ [Service Role Key]  │      │ [ZERO AUTH SCREEN]      │
└─────────┬────────┘      └──────────┬──────────┘      └────────────┬────────────┘
          │                          │                              │
          │ Service Role             │ Service Role                 │
          ▼                          ▼                              │
┌──────────────────────────────────────────────────────────┐        │
│          Supabase PostgreSQL (Database & Storage)        │        │
│          [Postgres Row Level Security BYPASSADO]         │        │
└──────────────────────────────────────────────────────────┘        │
          ▲                          ▲                              │
          │                          │                              │
          │ Webhook WhatsApp         │ Verificação Razorpay         │
┌─────────┴───────────────┐ ┌────────┴───────────────────┐          │
│ Maghgo / Meta Graph API │ │ Razorpay Gateway Service   │          │
│ (Token vazado em 401)   │ │ (ID de pedido substituível)│          │
└─────────────────────────┘ └────────────────────────────┘          │
                                                                    │
┌───────────────────────────────────────────────────────────────────┘
│ Invasor extrai dados do dispositivo Android via `adb backup`
▼
```

### 2.1 Fronteiras de Confiança (Trust Boundaries)
- **TB-1: Cliente Web Não Autenticado ↔ Next.js Server Components (`/admin/*`)**:
  - *Falha*: O arquivo `src/proxy.ts` não é reconhecido pelo Next.js (que exige obrigatoriamente `src/middleware.ts`). As páginas administrativas em React Server Components executam no servidor e consultam o banco com a chave `SUPABASE_SERVICE_ROLE_KEY` sem validar nenhuma sessão. Qualquer navegador acessa dados confidenciais diretamente.
- **TB-2: Cliente Web / Mobile ↔ API Handlers Administrativos (`/api/*`)**:
  - *Falha*: O endpoint `/api/admin/login` e as guardas em `src/lib/admin.ts` e `src/lib/guards.ts` verificam se o cookie `admin_token` contém a string literal e previsível `'authenticated'`. Não há assinatura criptográfica, chave HMAC ou consulta a banco.
- **TB-3: Firebase Auth ID Tokens ↔ Supabase Users Table (`/api/auth/sync`)**:
  - *Falha*: O backend aceita qualquer token Firebase válido e vincula o UID correspondente ao usuário existente na tabela `public.users` baseando-se exclusivamente no campo `email`, sem checar se `decoded.email_verified === true`.
- **TB-4: Cliente Móvel ↔ APIs de Backend (`EXPO_PUBLIC_API_URL`)**:
  - *Falha*: Os clientes móveis possuem fallbacks codificados para `http://localhost:3000` e habilitam tráfego em texto claro (`android:usesCleartextTraffic="true"`). Tokens de autorização trafegam desprotegidos em redes não confiáveis.
- **TB-5: Gateway de Pagamento Razorpay ↔ Verificação de Pedidos (`/api/payments/verify`)**:
  - *Falha*: O endpoint valida a assinatura criptográfica dos parâmetros fornecidos, mas não confere se o `razorpay_order_id` assinado pertence de fato ao `orderId` do pedido que está sendo marcado como pago.
- **TB-6: Webhooks Externos (WhatsApp / Maghgo) ↔ API de Notificações**:
  - *Falha*: O manipulador do webhook de WhatsApp valida o header de autorização contra `MAGHGO_BOT_TOKEN`. Em caso de falha, responde com HTTP 401 incluindo o token esperado no corpo do JSON (`debug: Expected '...'`).
- **TB-7: Cron Jobs Vercel ↔ Tarefas de Manutenção (`/api/cron/*`)**:
  - *Falha*: A verificação de segurança implementa lógica fail-open: caso `CRON_SECRET` não esteja configurado no ambiente, a validação é ignorada, permitindo disparo anônimo pela internet.

### 2.2 Ativos Críticos em Risco
1. **Credenciais de Superusuário de Banco de Dados (`SUPABASE_SERVICE_ROLE_KEY`)**:
   - Chave comprometida em texto claro em `.env` e `.env.local` na raiz do repositório (`[REDACTED_SECRET]`), permitindo leitura, escrita e exclusão irrestrita de todo o banco de dados.
2. **Chave Privada RSA do Google Cloud / Firebase (`FIREBASE_PRIVATE_KEY`)**:
   - Chave RSA corporativa completa exposta em `.env` (`MIIEvgIBADANBgkqhkiG9w0BAQE...`), permitindo forjar tokens administrativos no Firebase Auth e acessar recursos do projeto Google Cloud `hifi-6f926`.
3. **Credenciais do Gateway de Pagamento (`RAZORPAY_KEY_SECRET`)**:
   - Chave secreta de produção exposta em `.env` e `.env.local` (`DW7a6aZ8J7eSOsYYPXlj9tf6`), permitindo emissão de reembolsos fraudulentos, cancelamento de cobranças e leitura de dados bancários.
4. **Senha Administrativa Mestra (`ADMIN_PASSWORD`)**:
   - Senha mestra `"youcancemahoroga"` comprometida em `.env` e `.env.example`.
5. **Tokens de Integração de Mensageria (`MAGHGO_BOT_TOKEN`, `WHATSAPP_VERIFY_TOKEN`)**:
   - Tokens expostos em arquivos de ambiente e vazados ativamente em endpoints de erro HTTP 401.
6. **Dados Sensíveis de Clientes (PII)**:
   - Nomes completos, números de telefone, endereços físicos de entrega com CEP, histórico de compras, faturas e arquivos de design confidenciais.

---

## 3. Vulnerabilidades Encontradas

Abaixo está o catálogo completo e consolidado de vulnerabilidades encontradas no ecossistema HiFi, ordenadas rigorosamente por nível de severidade decrescente (**CRÍTICA**, **ALTA**, **MÉDIA**, **BAIXA**, **INFORMATIVA**).

| ID | Título da Vulnerabilidade | Severidade | STRIDE | CWE | Arquivo(s) e Linhas Afetadas |
|---|---|---|---|---|---|
| **VULN-01** | Exposição de Segredos de Produção em Arquivos `.env` e `.env.local` | **CRÍTICA** | Information Disclosure / Elevation of Privilege | CWE-798, CWE-312 | `/home/guru/hifi/.env:2-38`, `/home/guru/hifi/.env.local:2-18` |
| **VULN-02** | Bypass de Autenticação Administrativa via Cookie Estático Previsível | **CRÍTICA** | Elevation of Privilege / Spoofing | CWE-287, CWE-305 | `src/lib/admin.ts:31-37`, `src/lib/guards.ts:12-16`, `src/app/api/admin/login/route.ts:18-27` |
| **VULN-03** | Server Components Administrativos Desprotegidos por Arquivo `proxy.ts` Morto | **CRÍTICA** | Elevation of Privilege / Information Disclosure | CWE-306 | `src/proxy.ts:1-32`, `src/app/admin/*/page.tsx` |
| **VULN-04** | Ausência Total de Autenticação e Controles de Acesso no App Mobile Admin | **CRÍTICA** | Elevation of Privilege / Spoofing | CWE-306, CWE-285 | `hifi-mobile-admin/src/app/index.tsx:5-15`, `hifi-mobile-admin/src/app/(admin)/_layout.tsx:4-37` |
| **VULN-05** | Sequestro de Conta de Administrador via Sincronização de Email Não Verificado | **CRÍTICA** | Spoofing / Elevation of Privilege | CWE-287, CWE-303 | `src/app/api/auth/sync/route.ts:55-75`, `supabase/migrations/00014_auth_oauth_phone.sql:47-54` |
| **VULN-06** | Fraude de Cumprimento e Substituição de Pedido na Verificação Razorpay | **CRÍTICA** | Tampering / Elevation of Privilege | CWE-345, CWE-840 | `src/app/api/payments/verify/route.ts:41-56` |
| **VULN-07** | Vazamento Ativo de `MAGHGO_BOT_TOKEN` em Resposta de Erro HTTP 401 | **CRÍTICA** | Information Disclosure | CWE-209, CWE-532 | `src/app/api/webhooks/whatsapp/route.ts:19-28` |
| **VULN-08** | Bypass Universal de Políticas de RLS via Chave `SUPABASE_SERVICE_ROLE_KEY` | **ALTA** | Elevation of Privilege | CWE-284 | `src/lib/supabase/server.ts:13-19`, 26 API Route Handlers |
| **VULN-09** | Execução Fail-Open de Rotas Cron e Exclusão de Dados com `CRON_SECRET` Vazio | **ALTA** | Tampering / Denial of Service | CWE-306, CWE-636 | `src/app/api/cron/cleanup/route.ts:7-12`, `src/app/api/cron/promotions/route.ts:17-19` |
| **VULN-10** | Verificação Incorreta de Assinatura do Webhook Meta WhatsApp | **ALTA** | Tampering / Spoofing | CWE-345 | `src/lib/services/whatsapp.ts:11-20` |
| **VULN-11** | Fallback Inseguro do Webhook Secret Razorpay para Chave de API Leakeada | **ALTA** | Tampering / Spoofing | CWE-345, CWE-798 | `src/lib/services/payments.ts:28` |
| **VULN-12** | Promoção Automática Arbitrária para Admin em Triggers de Banco de Dados | **ALTA** | Elevation of Privilege | CWE-269 | `supabase/migrations/00006_auth_sync_rls.sql:29-32`, `00014_auth_oauth_phone.sql:62-65` |
| **VULN-13** | Tráfego HTTP em Texto Claro e Permissão de Cleartext Traffic no Android | **ALTA** | Information Disclosure / Tampering | CWE-319 | `hifi-mobile-shop/src/context/AuthContext.tsx:23`, Android Manifests |
| **VULN-14** | Ausência de Keystore Seguro de Hardware / Sessão Firebase em RAM Volátil | **ALTA** | Information Disclosure / Repudiation | CWE-922, CWE-311 | `hifi-mobile-shop/package.json:5-21`, `src/lib/firebase/client.ts:21-27` |
| **VULN-15** | Incompatibilidade de Autenticação Firebase com RLS Supabase (`auth.uid()`) | **ALTA** | Denial of Service / Elevation of Privilege | CWE-284 | `supabase/migrations/00016_firebase_auth_ids.sql:24-31` |
| **VULN-16** | IDOR e Exposição Pública de Informações no Rastreamento de Pedidos | **ALTA** | Information Disclosure | CWE-639 | `src/app/order/[id]/tracking/page.tsx:7-12` |
| **VULN-17** | Upload Irrestrito de Arquivos Arbitrários na Verificação de Pagamento | **ALTA** | Tampering / Resource Exhaustion | CWE-434, CWE-400 | `src/app/api/payments/verify/route.ts:95-109` |
| **VULN-18** | Inserção Anônima Irrestrita e Exaustão de Armazenamento em `analytics_events` | **MÉDIA** | Denial of Service | CWE-770, CWE-400 | `src/app/api/analytics/route.ts:51-86`, `00006_auth_sync_rls.sql:138-139` |
| **VULN-19** | Comparação em Tempo Não Constante de Senha de Admin e Segredos | **MÉDIA** | Information Disclosure | CWE-208 | `src/app/api/admin/login/route.ts:8`, `src/app/api/webhooks/whatsapp/route.ts:22` |
| **VULN-20** | Redirecionamento Aberto via URLs Relativas a Protocolo (`//attacker.com`) | **MÉDIA** | Spoofing | CWE-601 | `src/app/login/page.tsx:34`, `src/app/complete-signup/page.tsx:45` |
| **VULN-21** | Varredura de Tabela em Memória e DoS Algorítmico na Busca de Produtos | **MÉDIA** | Denial of Service | CWE-400 | `src/app/api/search/route.ts:9-17` |
| **VULN-22** | Construção Incorreta de URL Pública para Arquivos em Bucket Privado | **MÉDIA** | Information Disclosure / Repudiation | CWE-285, CWE-668 | `src/lib/services/whatsapp-notifications.ts:90-93`, `00005_private_storage.sql` |
| **VULN-23** | Extração de Dados da Sandbox Android via Backup do Sistema (`allowBackup`) | **MÉDIA** | Information Disclosure | CWE-921 | `hifi-mobile-admin/.../AndroidManifest.xml:14`, `hifi-mobile-shop/...` |
| **VULN-24** | Esquemas de Deep Link Personalizados Inseguros (`hifi-admin://`) sem App Links | **MÉDIA** | Spoofing / Tampering | CWE-939 | `hifi-mobile-admin/app.json:26`, `hifi-mobile-shop/app.json:26` |
| **VULN-25** | Ausência de SSL/TLS Certificate Pinning nos Aplicativos Móveis | **MÉDIA** | Tampering / Information Disclosure | CWE-295 | `hifi-mobile-admin/android/app/src/main/res/`, `hifi-mobile-shop/...` |
| **VULN-26** | Desconexão de Estado entre Captura Razorpay e Confirmação no Backend | **MÉDIA** | Repudiation / Denial of Service | CWE-840 | `hifi-mobile-shop/src/app/(shop)/cart.tsx:49-71` |
| **VULN-27** | Baixa Entropia Criptográfica em Códigos de Referência de Design ($31^4$) | **MÉDIA** | Spoofing / Tampering | CWE-330 | `src/lib/services/designs.ts:4, 9-14` |
| **VULN-28** | Scripts de Teste e Migração na Raiz Expondo Chave Service Role | **MÉDIA** | Information Disclosure / Privilege Escalation | CWE-798 | `/home/guru/hifi/run_migration.js`, `test_supabase.js`, `test_insert.js` |
| **VULN-29** | Pipeline de CI sem Varreduras de Segurança, SAST ou Testes Automatizados | **MÉDIA** | Tampering / Supply Chain | CWE-1104 | `.github/workflows/ci.yml:9-27` |
| **VULN-30** | Ausência Completa de Cabeçalhos HTTP de Segurança e CSP no Next.js | **MÉDIA** | Information Disclosure / Tampering | CWE-1021, CWE-693 | `next.config.ts:1-8` |
| **VULN-31** | Ausência de Proteção contra CSRF em Requisições Baseadas em Cookie | **BAIXA** | Tampering | CWE-352 | Todas as rotas de mutação administrativa |
| **VULN-32** | Permissões Excessivas no Android (`SYSTEM_ALERT_WINDOW`, Armazenamento) | **BAIXA** | Elevation of Privilege | CWE-250 | AndroidManifest.xml em ambos os apps móveis |
| **VULN-33** | Rotas Quebradas e Erros de Navegação Não Tratados nos Apps Móveis | **BAIXA** | Denial of Service | CWE-755 | `hifi-mobile-admin/src/app/index.tsx:10`, `hifi-mobile-shop/...` |
| **VULN-34** | Condição de Corrida na Sincronização de Autenticação Móvel | **BAIXA** | Repudiation / Tampering | CWE-362 | `hifi-mobile-shop/src/context/AuthContext.tsx:50-68` |
| **VULN-35** | Anomalia de Versão de Dependência no Mobile (`typescript: "^7.0.2"`) | **BAIXA** | Tampering / Supply Chain | CWE-1357 | `hifi-mobile-shop/package.json:33` |
| **VULN-36** | Configuração Canônica de URL em Texto Claro (`http://`) | **BAIXA** | Tampering / Information Disclosure | CWE-319 | `/home/guru/hifi/.env:19` |
| **VULN-37** | Chaves de Teste Razorpay e Client IDs Dummy Expostos nos Bundles | **INFORMATIVA** | Information Disclosure | CWE-798 | `hifi-mobile-shop/src/app/(shop)/cart.tsx:42` |
| **VULN-38** | Exposição de Marcas de Terceiros e Infraestrutura nos Rodapés | **INFORMATIVA** | Information Disclosure | CWE-200 | `hifi-mobile-admin/src/app/(admin)/index.tsx:20` |
| **VULN-39** | Diretório Vazio e Abandonado da Aplicação do Consumidor (`hifi-mobile`) | **INFORMATIVA** | - | - | `/home/guru/hifi/hifi-mobile` (0 arquivos) |

---

## 4. Threat Model

A modelagem de ameaças foi executada utilizando a metodologia formal **STRIDE** combinada ao processo de análise de risco orientado a negócios **PASTA** (7 estágios), acompanhado de simulações realistas de **Red Team**.

### 4.1 Matriz STRIDE por Componente de Arquitetura

| Componente | Spoofing | Tampering | Repudiation | Information Disclosure | Denial of Service | Elevation of Privilege |
|---|---|---|---|---|---|---|
| **Painel Web Admin** | Forja de cookie estático `admin_token` | Modificação de pedidos e cupons | Ações de admin logadas como `simple-admin` | Visualização de PII e faturas financeiras | Exclusão de dados em massa | Acesso total sem credencial mestra |
| **Next.js API Routes** | Falsificação de chamadas de webhook | Manipulação de assinaturas de pagamento | Falta de trilhas imutáveis em updates de pedidos | Vazamento de tokens em payloads 401 | DoS de banco via inserção de analytics | Bypass de RLS via Service Role Key |
| **Expo Mobile Admin** | Invocação direta de telas administrativas | N/A (app não conecta à API) | N/A | Exibição de métricas mockadas | Travamento por rotas inexistentes | Acesso irrestrito a botões de gestão |
| **Expo Mobile Shop** | Sequestro de scheme `hifi-shop://` | Interceptação MiTM em HTTP claro | Cobrança no banco sem pedido pago | Extração de SQLite via `adb backup` | Esgotamento de sessão por RAM volátil | Obtenção de permissões de overlay |
| **Supabase DB & Storage** | Assunção de identidade em `auth/sync` | Alteração de status de pagamento | Inexistência de logs de mutação de storage | Download não autorizado de designs | Exaustão de cota de armazenamento | Bypass completo de RLS por rota |

### 4.2 Modelo PASTA em 7 Estágios

1. **Estágio 1 — Objetivos de Negócio**:
   - A HiFi busca proteger: (a) a integridade financeira do fluxo de checkout e faturamento, (b) a privacidade e confidencialidade dos designs proprietários e PII dos clientes, e (c) a reputação da marca e entrega contínua dos serviços.
2. **Estágio 2 — Escopo Técnico**:
   - Next.js Web App, 28 API Routes, 3 Apps Expo, Banco Supabase PostgreSQL, Firebase Auth, Gateway Razorpay, Webhooks Meta/Maghgo.
3. **Estágio 3 — Decomposição da Aplicação**:
   - Mapeamento de fluxos de dados entre clientes web/mobile, funções lambda no Next.js, banco de dados gerenciado e APIs de terceiros. Identificação do uso irrestrito da `SUPABASE_SERVICE_ROLE_KEY`.
4. **Estágio 4 — Análise de Ameaças**:
   - Ameaças prioritárias: Fraude financeira em checkout, vazamento maciço de banco de dados, sequestro de contas administrativas, abuso de reputação e números de WhatsApp para envio de spam.
5. **Estágio 5 — Análise de Vulnerabilidades**:
   - Falta de validação de schemas, arquivo de middleware Next.js inoperante (`src/proxy.ts`), cookies estáticos em texto claro, fail-open em crons e segredos commitados no repositório.
6. **Estágio 6 — Modelagem de Ataques (Attack Trees)**:
   - *Árvore 1: Comprometimento Total do Banco de Dados* → Clone do repositório / leitura de `.env` → Obtenção de `SUPABASE_SERVICE_ROLE_KEY` → Conexão direta ao PostgREST / Supabase Studio → Exfiltração de todas as tabelas.
   - *Árvore 2: Fraude de Compras Gratuitas* → Criação de pedido de R$ 10.000 → Criação de pedido legítimo de R$ 1 → Pagamento de R$ 1 no Razorpay → Envio do signature de R$ 1 para `/api/payments/verify` referenciando o pedido de R$ 10.000 → Pedido de alto valor liberado para entrega.
7. **Estágio 7 — Análise de Risco & Impacto Financeiro**:
   - Risco financeiro imediato: Perda de mercadoria sem pagamento correspondente e estornos contínuos.
   - Risco regulatório: Infrações graves à LGPD e GDPR devido ao vazamento e acesso desprotegido a dados cadastrais e telefones.

### 4.3 Cenários Realistas de Ataque (Red Team)

#### Cenário 1: Visitante da Internet Não Autenticado Forja Acesso Administrativo Total
- **Persona**: Atacante externo com conhecimento básico de requisições HTTP (Script Kiddie ou Bot de varredura).
- **Pré-requisitos**: Nenhum. O atacante precisa apenas acessar a URL pública do site.
- **Passo a Passo**:
  1. O atacante inspeciona o código-fonte client-side do frontend ou realiza um teste de força bruta de cookies e cabeçalhos.
  2. O atacante injeta no navegador o cookie `admin_token=authenticated`.
  3. O atacante navega até `http://hificustom.goatech.tech/admin/orders` ou emite chamadas para `/api/customers`, `/api/orders`, `/api/audit`.
  4. O servidor Next.js avalia `cookieStore.get('admin_token')?.value === 'authenticated'` em `checkAdminAuth()` (`src/lib/admin.ts:33`), retornando `true`.
  5. Alternativamente, sem nenhum cookie, o atacante navega diretamente para `http://hificustom.goatech.tech/admin/roles` ou `/admin/payments`. Como o arquivo de rota se chama `src/proxy.ts` em vez de `middleware.ts`, o Next.js não executa nenhuma interceptação.
- **Resultado**: O atacante visualiza todas as faturas, exporta a lista completa de clientes com endereços e telefones, e pode alterar o status de qualquer pedido para "entregue" ou "cancelado".
- **Dificuldade**: Trivial (1/5) | **Detecção Atual**: Nula.

#### Cenário 2: Cliente Malicioso Substitui Assinatura Razorpay e Realiza Fraude Financeira
- **Persona**: Cliente registrado no e-commerce buscando obter itens customizados sem pagar o valor real.
- **Pré-requisitos**: Conta de cliente e saldo mínimo (ex: R$ 1,00) em cartão ou PIX.
- **Passo a Passo**:
  1. O atacante cria o Pedido A no carrinho com 10 jaquetas customizadas totalizando R$ 5.000,00 (`orderId: "ord_high_value"`).
  2. O atacante cria o Pedido B com um adesivo promocional de R$ 1,00 (`orderId: "ord_low_value"`).
  3. No checkout do Pedido B, o atacante efetua o pagamento de R$ 1,00 no popup do Razorpay, recebendo do gateway: `razorpay_order_id`, `razorpay_payment_id` e `razorpay_signature`.
  4. O atacante intercepta a requisição HTTP POST para `/api/payments/verify` e substitui o payload:
     - `orderId`: `"ord_high_value"`
     - `razorpay_order_id`: `"order_from_cheap_payment"`
     - `razorpay_payment_id`: `"pay_from_cheap_payment"`
     - `razorpay_signature`: `"valid_signature_for_cheap_payment"`
  5. O endpoint `/api/payments/verify` valida que a assinatura é matematicamente válida para o pedido de R$ 1,00. Contudo, o código **não verifica** se o `razorpay_order_id` informado corresponde ao `order.razorpay_order_id` registrado no Pedido A.
  6. O backend atualiza o Pedido A para `status: 'paid'`, emite fatura oficial e dispara alerta no WhatsApp da fábrica para início imediato da produção.
- **Resultado**: Furto de produtos de alto valor com prejuízo financeiro direto e emissão de nota/fatura indevida.
- **Dificuldade**: Fácil (2/5) | **Detecção Atual**: Nula no momento da compra; descoberta apenas na conciliação contábil manual no fim do mês.

#### Cenário 3: Atacante Sequestra a Conta Mestra do Administrador via Sincronização Firebase
- **Persona**: Atacante externo com intenção de controle permanente sobre o sistema.
- **Pré-requisitos**: Conhecimento do email do administrador (`admin@hificustoms.com`, listado publicamente em migrations e seed.sql).
- **Passo a Passo**:
  1. O atacante acessa a tela de login de clientes (`/login`) ou utiliza o Firebase Auth Client SDK diretamente.
  2. O atacante cria uma conta no Firebase via método Email/Senha ou provedor OAuth com o email `admin@hificustoms.com`. O atacante **não** precisa confirmar o email nem ter acesso à caixa postal do administrador.
  3. O atacante obtém o Firebase ID Token emitido para esse UID recém-criado.
  4. O atacante faz uma requisição `POST /api/auth/sync` passando o `idToken`.
  5. O backend decodifica o token com Firebase Admin SDK. Ele constata que o email é `admin@hificustoms.com`, mas **não checa** `decoded.email_verified`.
  6. A consulta em `public.users` localiza a linha do administrador (`byEmail`).
  7. O código executa `UPDATE public.users SET auth_id = decoded.uid WHERE id = byEmail.id`.
  8. Em migrações anteriores (`00006_auth_sync_rls.sql:30`), o email `admin@hificustoms.com` é forçado para `role = 'admin'`.
- **Resultado**: O atacante agora possui o `auth_id` vinculado à conta do administrador no banco de dados e controle total do perfil.
- **Dificuldade**: Fácil (2/5) | **Detecção Atual**: Nula.

#### Cenário 4: Ladrão Físico Extrai Dados Locais e Sessões via `adb backup` no Android
- **Persona**: Ator malicioso com acesso temporário ou físico a um smartphone desbloqueado com o app HiFi Shop ou Admin instalado.
- **Pré-requisitos**: Dispositivo Android com depuração USB habilitada ou acesso físico ao aparelho.
- **Passo a Passo**:
  1. O atacante conecta o smartphone a um computador via USB.
  2. O atacante executa: `adb backup -f hifi_backup.ab -noapk tech.goat.hifishop`.
  3. Como o arquivo `AndroidManifest.xml` define expressamente `android:allowBackup="true"`, o sistema operacional Android permite o dump completo da pasta `/data/data/tech.goat.hifishop`.
  4. O atacante converte o arquivo `.ab` em um arquivo `.tar` utilizando ferramentas padrão (`dd`, `openssl`).
  5. O atacante descompacta o banco de dados SQLite local, caches HTTP contendo tokens e respostas JSON da API com dados de faturamento e cartões salvos.
- **Resultado**: Exfiltração de dados pessoais, chaves de sessão e históricos de transação gravados no dispositivo.
- **Dificuldade**: Fácil a Média (2/5) | **Detecção Atual**: Impossível de detectar pelo backend.

---

## 5. Correcoes Propostas

Nesta seção são fornecidas implementações concretas e prontas para produção para mitigar cada vulnerabilidade **CRÍTICA** e **ALTA** identificada na auditoria.

### 5.1 Correção VULN-01 & VULN-07: Higienização Imediata e Rotação de Segredos
**Ação Imediata**: Todas as chaves expostas no `.env` e `.env.local` devem ser imediatamente revogadas nos consoles do Supabase, Google Cloud (Firebase), Razorpay e Render. Nenhuma chave secreta deve permanecer versionada.

No arquivo `src/app/api/webhooks/whatsapp/route.ts`, remover a concatenação do token esperado nas mensagens de erro:

```typescript
// ARQUIVO: src/app/api/webhooks/whatsapp/route.ts
// SUBSTITUIR O BLOCO DAS LINHAS 19-28 POR:

const authHeader = request.headers.get('authorization');
const botToken = process.env.MAGHGO_BOT_TOKEN;

if (!botToken || !authHeader) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Utilizar comparação em tempo constante para evitar timing attacks
const expectedAuth = `Bearer ${botToken}`;
const authBuffer = Buffer.from(authHeader);
const expectedBuffer = Buffer.from(expectedAuth);

if (
  authBuffer.length !== expectedBuffer.length ||
  !crypto.timingSafeEqual(authBuffer, expectedBuffer)
) {
  // NUNCA vazar o segredo nem no log nem na resposta JSON
  console.warn('Alerta de Seguranca: Tentativa de acesso nao autorizado ao Webhook WhatsApp.');
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 5.2 Correção VULN-02 & VULN-03: Implementação de Sessão Criptografada e Middleware Oficial Next.js

1. **Renomear e Configurar o Middleware Oficial**:  
   Excluir/renomear `src/proxy.ts` para `src/middleware.ts` para que o ciclo de roteamento do Next.js intercepte todas as requisições administrativas em Server Components e Route Handlers:

```typescript
// ARQUIVO: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminSessionToken } from '@/lib/admin-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger todas as rotas administrativas, exceto a página de login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionCookie = request.cookies.get('hifi_admin_session')?.value;

    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifyAdminSessionToken(sessionCookie);
    if (!session || session.role !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'invalid_session');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

2. **Implementar Sessão Criptografada HMAC/JWT (`src/lib/admin-session.ts`)**:

```typescript
// ARQUIVO: src/lib/admin-session.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || 'FALLBACK_RANDOM_LONG_SECRET_KEY_MUST_BE_IN_ENV'
);

export interface AdminPayload {
  sub: string;
  role: 'admin';
  email: string;
}

export async function createAdminSession(email: string): Promise<string> {
  return new SignJWT({ role: 'admin', email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET_KEY);
}

export async function verifyAdminSessionToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('hifi_admin_session')?.value;
  if (!token) return false;
  const session = await verifyAdminSessionToken(token);
  return session?.role === 'admin';
}
```

### 5.3 Correção VULN-04: Implementação de Autenticação no App Mobile Admin
Substituir o link estático no app móvel por um formulário seguro de autenticação com validação de credenciais via backend:

```tsx
// ARQUIVO: hifi-mobile-admin/src/app/index.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Informe email e senha.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.error || 'Credenciais inválidas');
      }
      // Armazenar o token em hardware seguro
      await SecureStore.setItemAsync('hifi_admin_jwt', data.token);
      router.replace('/(admin)');
    } catch (err: any) {
      Alert.alert('Falha na Autenticação', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HIFI Admin</Text>
      <Text style={styles.subtitle}>Acesso Restrito</Text>
      <TextInput
        style={styles.input}
        placeholder="Email do Administrador"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>
    </View>
  );
}
```

### 5.4 Correção VULN-05: Exigir Verificação Criptográfica de Email no Account Linking
Modificar `/api/auth/sync/route.ts` para exigir que o endereço de e-mail tenha sido previamente verificado pelo provedor antes de vincular o registro na tabela `public.users`:

```typescript
// ARQUIVO: src/app/api/auth/sync/route.ts
// SUBSTITUIR O BLOCO DAS LINHAS 55-75 POR:

if (email) {
  // EXIGIR expressamente verificação do e-mail para prevenir account takeover
  if (!decoded.email_verified) {
    return NextResponse.json(
      { error: 'Email não verificado. Confirme seu endereço de email antes de prosseguir.' },
      { status: 403 }
    );
  }

  const { data: byEmail, error: byEmailError } = await supabase
    .from('users')
    .select('id, auth_id, role')
    .ilike('email', email)
    .maybeSingle();

  if (byEmailError) throw byEmailError;

  if (byEmail) {
    // Se a conta existente pertencer a um administrador, bloquear sincronização anônima
    if (byEmail.role === 'admin') {
      return NextResponse.json(
        { error: 'Contas de administrador não podem ser vinculadas via auto-atendimento.' },
        { status: 403 }
      );
    }

    // Vincular com segurança
    const { error: linkError } = await supabase
      .from('users')
      .update({
        auth_id: decoded.uid,
        ...(requestedName ? { full_name: requestedName } : {}),
        ...(phone ? { phone } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', byEmail.id);

    if (linkError) throw linkError;
    return NextResponse.json({ success: true, userId: byEmail.id });
  }
}
```

### 5.5 Correção VULN-06: Validação de Vínculo entre Pedido e Assinatura Razorpay
Conferir se o ID do pedido retornado pelo gateway é exatamente o que está registrado no registro do banco de dados antes de efetuar a baixa de pagamento:

```typescript
// ARQUIVO: src/app/api/payments/verify/route.ts
// ATUALIZAR O BLOCO DAS LINHAS 35-55:

const { data: order, error: orderErr } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .maybeSingle();

if (orderErr || !order) {
  return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
}

if (order.user_id !== profile.id) {
  return NextResponse.json({ error: 'Não autorizado para este pedido' }, { status: 403 });
}

// VALIDAÇÃO CRÍTICA ANTI-FRAUDE:
// O ID do pedido assinado DEVE ser estritamente igual ao gravado no pedido no ato do checkout!
if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
  console.error(`Tentativa de Fraude: Pedido ${orderId} possui razorpay_order_id ${order.razorpay_order_id}, mas recebeu ${razorpay_order_id}`);
  return NextResponse.json({ error: 'Assinatura inválida: divergência de pedido Razorpay' }, { status: 400 });
}

// Verificar assinatura criptográfica com timing-safe comparison
const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
if (!valid) {
  return NextResponse.json({ error: 'Assinatura de pagamento inválida' }, { status: 400 });
}
```

### 5.6 Correção VULN-09: Eliminar Fail-Open em Rotas Cron
Garantir que as rotas cron falhem de forma segura caso `CRON_SECRET` não esteja configurado no servidor:

```typescript
// ARQUIVO: src/app/api/cron/cleanup/route.ts e src/app/api/cron/promotions/route.ts
const cronSecret = process.env.CRON_SECRET;
const authHeader = request.headers.get('authorization');

// FAIL-SECURE: Se a variável não estiver definida OU o token for incorreto, BLOQUEAR.
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 5.7 Correção VULN-10: Assinatura do Webhook do WhatsApp com Meta App Secret
O cabeçalho `X-Hub-Signature-256` emitido pela Meta utiliza o **App Secret** da aplicação Meta, não o Verify Token (que serve apenas para o handshake GET):

```typescript
// ARQUIVO: src/lib/services/whatsapp.ts
export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  
  // Utilizar META_APP_SECRET, que é a chave HMAC correta
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.error('META_APP_SECRET não configurado no servidor.');
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signatureHeader.replace(/^sha256=/, '');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(provided, 'utf8');

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
```

### 5.8 Correção VULN-14 & VULN-23: Armazenamento Seguro e Hardening no Android
1. **Configurar Persistência Segura com `expo-secure-store`**:
   Instalar `expo-secure-store` em `hifi-mobile-shop` e `hifi-mobile-admin`.
2. **Desativar Backup e Tráfego Não Seguro no `AndroidManifest.xml`**:

```xml
<!-- ARQUIVO: android/app/src/main/AndroidManifest.xml -->
<application
  android:name=".MainApplication"
  android:label="@string/app_name"
  android:icon="@mipmap/ic_launcher"
  android:roundIcon="@mipmap/ic_launcher_round"
  android:allowBackup="false"
  android:usesCleartextTraffic="false"
  android:theme="@style/AppTheme">
```

---

## 6. Hardening E Melhorias

Recomendações técnicas de defesa em profundidade (Blue Team) para elevar o ecossistema HiFi ao padrão industrial de resiliência e conformidade:

### 6.1 Cabeçalhos HTTP de Segurança no Next.js (`next.config.ts`)
Configurar cabeçalhos estritos de proteção contra Clickjacking, MIME-sniffing, XSS e imposição de tráfego HTTPS:

```typescript
// ARQUIVO: next.config.ts
import type { NextConfig } from 'next';

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://zxvzbuiavxhqkrczxstj.supabase.co https://hificustom.goatech.tech;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://zxvzbuiavxhqkrczxstj.supabase.co https://api.razorpay.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com;
  frame-src 'self' https://api.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 6.2 Rate Limiting Global e Proteção contra Abuso de APIs
Implementar controle de taxa de requisições baseado em Token Bucket (utilizando Redis ou `@upstash/ratelimit`) para proteger rotas públicas como `/api/analytics`, `/api/search` e `/api/admin/login`:
- Limite de 5 tentativas por minuto para `/api/admin/login` (mitigação de força bruta).
- Limite de 30 requisições por minuto por IP para `/api/analytics` e `/api/search` (mitigação de DoS e esgotamento de recursos).

### 6.3 Hardening do Pipeline de CI/CD (`.github/workflows/ci.yml`)
Adicionar etapas automáticas de SAST, detecção de segredos e verificação de dependências em cada Pull Request:

```yaml
# ARQUIVO: .github/workflows/ci.yml
name: Security Audit & Build

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Gitleaks Secret Scanner
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.x
          cache: 'npm'

      - name: Dependency Vulnerability Audit
        run: npm audit --audit-level=high

      - name: Install dependencies
        run: npm ci

      - name: Lint Codebase
        run: npm run lint

      - name: Build Next.js
        run: npm run build
```

### 6.4 Arquitetura de RLS no Banco de Dados
Para eliminar a dependência excessiva da chave de superusuário (`SUPABASE_SERVICE_ROLE_KEY`):
1. **Configurar Supabase Custom JWTs**: Configurar o Supabase para validar tokens JWT emitidos pelo Firebase utilizando o JWKS do Firebase (`https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`).
2. **Reestabelecer Políticas RLS por Usuário**: Com os claims do Firebase lidos nativamente pelo Postgres, as políticas RLS (`auth.uid() = users.auth_id`) voltam a operar nativamente no banco de dados, protegendo os registros mesmo em caso de falhas na camada da aplicação.

### 6.5 Pinning de Certificados SSL/TLS nos Aplicativos Móveis
Para impedir ataques Man-in-the-Middle (MiTM) em redes corporativas ou Wi-Fi públicas:
- Criar `android/app/src/main/res/xml/network_security_config.xml` configurando pins SHA-256 para os domínios `hificustom.goatech.tech`, `supabase.co` e `razorpay.com`.
- Desativar totalmente `NSAllowsArbitraryLoads` e `NSAllowsLocalNetworking` no `Info.plist` de produção no iOS.

---

## 7. Scoring

A avaliação quantitativa de segurança do projeto HiFi foi calculada conforme a metodologia rigorosa do padrão 007 Chief Security Architect AI, com notas de 0 a 100 distribuídas pelos 8 domínios de governança técnica.

### 7.1 Tabela Quantitativa de Avaliação por Domínio

| Domínio de Segurança | Peso | Nota (0-100) | Nota Ponderada | Justificativa Técnica do Score |
|---|:---:|:---:|:---:|---|
| **Segredos & Credenciais** | 20% | **10** | **2.00** | Presença de chaves de superusuário de banco (`SUPABASE_SERVICE_ROLE_KEY`), chave privada RSA do Firebase Admin, senha mestra de admin e chave do Razorpay em texto claro no repositório (`.env`, `.env.local`). Vazamento ativo de `MAGHGO_BOT_TOKEN` em respostas HTTP 401. |
| **Input Validation** | 15% | **25** | **3.75** | Ausência total de bibliotecas de schema (`Zod`/`Yup`). Verificação de pagamento vulnerável a substituição de pedido. Upload irrestrito de arquivos em memória sem validação de MIME. Redirecionamento aberto via `//evil.com`. |
| **Autenticação & Autorização** | 15% | **12** | **1.80** | Bypass universal de admin via cookie estático `admin_token=authenticated`. Server components administrativos totalmente abertos devido ao `proxy.ts` morto. App mobile admin com zero autenticação. Sequestro de conta admin via sincronização de e-mail não verificado. |
| **Proteção de Dados** | 15% | **20** | **3.00** | RLS ignorado universalmente nas rotas via chave Service Role. Tráfego HTTP em texto claro permitido no Android e nos clientes Expo. Ausência de `expo-secure-store` com sessões mantidas em memória volátil. Backups do sandbox liberados (`allowBackup="true"`). |
| **Resiliência** | 10% | **30** | **3.00** | Endpoints de analytics e search suscetíveis a exaustão de disco e memória (in-memory scans). Falta de tratamento transacional e recuperação de pagamento no app mobile caso a rede oscile após débito na operadora. |
| **Monitoramento** | 10% | **35** | **3.50** | Logs contêm credenciais e tokens em chamadas de erro. Não há telemetria centralizada de eventos de segurança, auditoria de ações de superusuários ou alertas de tentativas de intrusão. |
| **Supply Chain** | 10% | **40** | **4.00** | CI/CD não possui SAST, `npm audit` ou varredura de segredos. Anomalia de dependência no mobile (`typescript: "^7.0.2"`). Diretório do aplicativo do consumidor (`hifi-mobile`) completamente vazio e abandonado. |
| **Compliance** | 5% | **20** | **1.00** | Ausência total de cabeçalhos de segurança (CSP, HSTS, X-Frame-Options). Não conformidade com OWASP Top 10 (A01, A02, A03, A05, A07) e diretrizes básicas do PCI-DSS para integridade de transações. |
| **TOTAL CONSOLIDADO** | **100%** | — | **22.05 / 100** | **Score Final: 22 (Veredito: BLOQUEADO TOTAL)** |

### 7.2 Cálculo Explícito da Média Ponderada
$$\text{Score Final} = (10 \times 0.20) + (25 \times 0.15) + (12 \times 0.15) + (20 \times 0.15) + (30 \times 0.10) + (35 \times 0.10) + (40 \times 0.10) + (20 \times 0.05)$$
$$\text{Score Final} = 2.00 + 3.75 + 1.80 + 3.00 + 3.00 + 3.50 + 4.00 + 1.00 = \mathbf{22.05 \approx 22 / 100}$$

---

## 8. Veredito Final

### Veredito Técnico: ⛔ BLOQUEADO TOTAL (Score: 22 / 100)

**Justificativa Técnica**:
O ecossistema de software da HiFi apresenta vulnerabilidades estruturais e críticas em praticamente todas as camadas de segurança da informação. O sistema permite que qualquer usuário não autenticado na internet assuma privilégios de administrador geral forjando um cookie estático ou acessando diretamente Server Components desprotegidos. A chave privada RSA corporativa do Firebase e as credenciais de superusuário do banco de dados estão expostas em texto claro. Além disso, o fluxo financeiro de checkout permite que clientes adquiram mercadorias de alto valor substituindo o identificador de pagamento por uma transação de valor ínfimo.

No estado atual, **o sistema é considerado extremamente inseguro e inadequado para operação em ambiente de produção**, representando risco severo de fraude financeira direta, exfiltração de dados em massa e comprometimento completo da infraestrutura em nuvem.

### Condições Obrigatórias para Reavaliação e Liberação (Release Gates):
Para que o bloqueio seja revogado e o sistema possa avançar para homologação/produção, as seguintes condições não-negociáveis devem ser implementadas e auditadas:

1. **[GATE-01] Rotação e Revogação Imediata de Segredos**:
   - Revogar e gerar novas credenciais para Supabase Service Role, Firebase Admin RSA Key, Razorpay Key Secret, Maghgo Bot Token e Meta App Secret.
   - Remover os arquivos `.env` e `.env.local` do controle de versão e do disco compartilhado, adotando um cofre seguro de variáveis de ambiente (Vercel Environment Secrets / Doppler).
2. **[GATE-02] Reestruturação da Autenticação Administrativa**:
   - Eliminar a validação por cookie `admin_token=authenticated`.
   - Renomear `src/proxy.ts` para `src/middleware.ts` e implementar validação criptográfica de sessões com tokens JWT/HMAC assinados via `jose` ou NextAuth.
3. **[GATE-03] Autenticação Obrigatória no App Mobile Admin**:
   - Implementar tela de autenticação funcional com validação de credenciais de administrador e armazenamento seguro via `expo-secure-store`.
4. **[GATE-04] Blindagem do Endpoint de Verificação de Pagamentos**:
   - Garantir que o endpoint `/api/payments/verify` valide estritamente se `order.razorpay_order_id === razorpay_order_id`, impedindo a validação de pedidos com transações de outros itens.
5. **[GATE-05] Proteção contra Account Takeover em `/api/auth/sync`**:
   - Exigir `decoded.email_verified === true` antes de vincular UIDs do Firebase a contas de usuários preexistentes e bloquear a vinculação de contas com a role `admin`.
6. **[GATE-06] Eliminação de Vazamento de Segredos em Respostas de Erro**:
   - Remover qualquer informação de tokens ou segredos dos corpos de resposta HTTP de depuração no webhook do WhatsApp.
7. **[GATE-07] Ativação de Cabeçalhos HTTP de Segurança e CSP**:
   - Configurar `next.config.ts` com cabeçalhos HSTS, X-Frame-Options, X-Content-Type-Options e Content-Security-Policy restritiva.
8. **[GATE-08] Hardening Mobile Android**:
   - Configurar `android:allowBackup="false"`, desativar `android:usesCleartextTraffic` e remover permissões desnecessárias como `SYSTEM_ALERT_WINDOW`.
