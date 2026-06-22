# Documentacao Tecnica Detalhada

## 1. Objetivo desta documentacao

Este documento descreve, de forma completa:

1. Cada funcionalidade implementada na aplicacao.
2. Por que cada solucao tecnica foi escolhida.
3. Como as regras de negocio foram traduzidas em codigo.
4. Por que o modelo 3FN foi adotado.
5. Como a arquitetura atual se relaciona com arquitetura limpa.
6. Se o projeto hoje esta em POO e se precisa refatoracao total.

## 2. Visao geral da solucao

### 2.1 Stack e runtime

1. Frontend: Ionic 8 + Angular 20 (standalone components).
2. Linguagem: TypeScript.
3. Estado no frontend: Angular Signals no servico de jornada.
4. Mocks de dados: servidos internamente no frontend (modo estatico, sem backend no deploy).

### 2.2 Estrutura principal de pastas

1. src/app/core/models:
   contratos tipados do dominio e da jornada.
2. src/app/core/services:
   regra de orquestracao local e acesso HTTP.
3. src/app/journey/pages:
   telas de Inicio, Historico, Pendencias, Campanhas e Tabs.
4. src/app/journey/components:
   componentes reutilizaveis (seletor de crianca e badge de status).
5. mock-api:
   servidor de mock e base de dados para testes funcionais.

## 3. Funcionalidades detalhadas

## 3.1 Tabs e navegacao

Arquivo principal: src/app/app.routes.ts

1. Rota raiz abre a pagina de tabs.
2. As 4 features sao rotas filhas:
   inicio, historico, pendencias, campanhas.
3. Fallback redireciona para inicio.

Por que foi usado:

1. Mantem navegacao previsivel no mobile.
2. Isola cada tela com lazy loading.
3. Facilita evolucao de cada modulo de pagina.

## 3.2 Tela Inicio

Arquivos:

1. src/app/journey/pages/inicio/inicio.page.ts
2. src/app/journey/pages/inicio/inicio.page.html
3. src/app/journey/pages/inicio/inicio.page.scss

Funcionalidades:

1. Exibe KPI de familias, criancas, doses em atraso e campanhas ativas.
2. Lista familias com seus filhos e resumo vacinal por crianca.
3. Permite navegar para Historico por crianca.
4. Permite editar crianca por modal (nome, nascimento, genero).
5. Exibe estados de carregamento e erro com retry.

Por que foi usado:

1. KPI: leitura rapida do estado geral da carteira vacinal.
2. Agrupamento por familia: atende cenario de multiplas criancas por responsavel.
3. Modal de edicao: reduz mudanca de contexto e acelera manutencao cadastral.
4. Signals no componente: atualizacao imediata sem boilerplate de subscriptions na view.

## 3.3 Tela Historico

Arquivos:

1. src/app/journey/pages/historico/historico.page.ts
2. src/app/journey/pages/historico/historico.page.html

Funcionalidades:

1. Troca de crianca pelo seletor horizontal.
2. Lista apenas doses aplicadas da crianca selecionada.
3. Abre modal com detalhe da aplicacao.

Por que foi usado:

1. Foco clinico: separar historico aplicado de pendencias melhora leitura.
2. Selector global por crianca: evita duplicar logica de contexto nas telas.

## 3.4 Tela Pendencias

Arquivos:

1. src/app/journey/pages/pendencias/pendencias.page.ts
2. src/app/journey/pages/pendencias/pendencias.page.html

Funcionalidades:

1. Divide a visao em Em atraso e Pendentes.
2. Lista por crianca selecionada.
3. Modal com detalhe da dose pendente/atrasada.

Por que foi usado:

1. OVERDUE e PENDING representam risco distinto e prioridade distinta.
2. Separacao em secoes ajuda priorizacao de acao do responsavel.

## 3.5 Tela Campanhas

Arquivos:

1. src/app/journey/pages/campanhas/campanhas.page.ts
2. src/app/journey/pages/campanhas/campanhas.page.html

Funcionalidades:

1. Filtra campanhas ativas para a crianca selecionada.
2. Exibe prazo restante e publico alvo.
3. Modal com detalhe completo da campanha.

Por que foi usado:

1. Evita mostrar campanha irrelevante para faixa etaria da crianca.
2. Destaca urgencia por remainingDays.

## 4. Servicos e responsabilidades

## 4.1 MockApiService (gateway HTTP)

Arquivo: src/app/core/services/mock-api.service.ts

Responsabilidades:

1. Centralizar chamadas HTTP da aplicacao.
2. Expor metodos de leitura de dashboard, familias, criancas, historico e campanhas.
3. Expor updateChild para edicao cadastral.

Por que foi usado:

1. Separa infra HTTP da regra de negocio da jornada.
2. Facilita troca futura da mock API por API real sem reescrever paginas.
3. Mantem contratos tipados, reduzindo erro de integracao.

## 4.2 LocalJourneyService (orquestracao de regra)

Arquivo: src/app/core/services/local-journey.service.ts

Responsabilidades:

1. Carregar dados base e manter estado reativo da jornada.
2. Manter contexto da crianca selecionada.
3. Aplicar regra de status (aplicada, pendente, atraso).
4. Expor seletores de view (applied, pending, overdue, campaigns).
5. Fazer mapeamento de modelo de API para modelo de jornada.
6. Persistir edicao de crianca e atualizar estado local.

Por que foi usado:

1. Evita duplicacao de regra em cada pagina.
2. Mantem um unico ponto de verdade para a jornada.
3. Favorece testabilidade por concentrar regra fora da UI.

## 5. Regras de negocio implementadas no codigo

Base principal: mock-api/server.js e local-journey.service.ts

### 5.1 Status por dose

1. APPLIED: tem appliedDate.
2. OVERDUE: sem appliedDate e scheduledDate anterior a hoje.
3. PENDING: sem appliedDate e scheduledDate hoje ou futura.

### 5.2 Situacao vacinal da crianca (prioridade)

1. Se houver alguma dose OVERDUE, situacao da crianca = OVERDUE.
2. Senao, se houver alguma dose PENDING, situacao = PENDING.
3. Senao, situacao = APPLIED.

### 5.3 Campanhas

1. Campanha ativa quando hoje esta entre startDate e endDate.
2. remainingDays calculado por diferenca em dias com piso zero.
3. Filtro por crianca aplica faixa etaria alvo da campanha.

### 5.4 Edicao de crianca

1. Nome minimo valido (>= 2 chars).
2. BirthDate valida.
3. Genero limitado a M/F.
4. Persistencia na mock API e atualizacao imediata no estado local.

## 6. Por que 3FN foi usada

Referencia principal:

1. docs/01-modelagem-dados-3fn.md
2. docs/sql/schema.sql

Decisao:

1. O dominio e fortemente relacional (crianca, dose, aplicacao, campanha, triagem).
2. 3FN reduz redundancia e inconsistencias.
3. FK, UNIQUE e CHECK protegem regra de negocio no nivel de dados.

Beneficios práticos no projeto:

1. Evita duplicar dados de vacina em varias tabelas de aplicacao.
2. Permite consultas confiaveis para atraso, pendencia e historico.
3. Facilita manutencao e evolucao (novas vacinas, novas campanhas).

## 7. Arquitetura limpa: estado atual

Conclusao objetiva: o projeto esta em uma arquitetura limpa simplificada, nao em clean architecture canonica completa.

### 7.1 O que ja esta alinhado

1. Separacao de responsabilidades:
   UI nas paginas/componentes, regra em servico, acesso remoto em gateway HTTP.
2. Modelos tipados no core.
3. Dependencia da UI para o servico de caso de uso, nao direto para HTTP.

### 7.2 O que ainda e simplificado

1. Ainda nao existe camada explicita de UseCases com interfaces de repositorio.
2. mock-api/server.js concentra regra e transporte no mesmo modulo.
3. Nao ha injecao por portas/adapters formais em todo o frontend.

### 7.3 Quando vale evoluir para clean architecture completa

1. Quando houver API real + offline + sincronizacao complexa.
2. Quando aumentar equipe e for necessario forte isolamento de dominio.
3. Quando os casos de uso crescerem muito e exigirem teste unitario profundo por caso.

## 8. POO: estamos usando ou nao?

Conclusao direta: sim, estamos usando POO no frontend e parcialmente no backend.

### 8.1 Evidencias de POO atual

1. Classes de servico com encapsulamento de estado e comportamento.
2. Componentes Angular em classe, com estado/metodos coesos.
3. Inversao de dependencia via injecao de dependencia.
4. Contratos de dados por interfaces TypeScript.

### 8.2 O que nao estamos usando de forma forte

1. Entidades de dominio com comportamento rico (metodos de negocio dentro de entidade).
2. Hierarquias complexas e polimorfismo de dominio.

### 8.3 Precisa refatorar todo codigo para POO agora?

Resposta tecnica: nao.

Motivo:

1. O projeto ja aplica POO suficiente para escala atual.
2. Refatoracao total agora teria alto custo e baixo ganho imediato.
3. O maior retorno agora esta em testes, observabilidade e UX.

## 9. Plano de evolucao (se quiser POO + clean architecture mais estrita)

1. Criar camada de casos de uso em src/app/core/use-cases.
2. Definir interfaces de repositorio no dominio.
3. Implementar adapter HTTP separado por repositorio.
4. Mover regras de status e campanha para entidades/servicos de dominio puros.
5. Cobrir casos de uso com testes unitarios.

## 10. Rastreabilidade: funcionalidade -> arquivo

1. Navegacao e rotas:
   src/app/app.routes.ts
2. Tabs:
   src/app/journey/pages/tabs/tabs.page.ts
   src/app/journey/pages/tabs/tabs.page.html
3. Home e edicao de crianca:
   src/app/journey/pages/inicio/inicio.page.ts
   src/app/journey/pages/inicio/inicio.page.html
4. Historico:
   src/app/journey/pages/historico/historico.page.ts
5. Pendencias:
   src/app/journey/pages/pendencias/pendencias.page.ts
6. Campanhas:
   src/app/journey/pages/campanhas/campanhas.page.ts
7. Regras e estado de jornada:
   src/app/core/services/local-journey.service.ts
8. Gateway HTTP:
   src/app/core/services/mock-api.service.ts
9. API mock e regras no servidor:
   mock-api/server.js
10. Modelo 3FN:
   docs/01-modelagem-dados-3fn.md
   docs/sql/schema.sql

## 11. Checklist rapido para manutencao

1. Subir mock API: npm run mock:api
2. Subir app: npm start
3. Build validacao: npm run build
4. Validar fluxo minimo:
   - trocar aba
   - trocar crianca
   - abrir modal de detalhe
   - editar crianca
   - validar reflexo no estado
