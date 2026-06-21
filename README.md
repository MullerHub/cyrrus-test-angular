# Cyrrus Test Angular - Vacinacao Infantil

Aplicacao Ionic + Angular para acompanhamento da jornada vacinal infantil.

## Objetivo

Entregar uma solucao digital simples e intuitiva para:
- acompanhamento de criancas;
- consulta de historico vacinal;
- visualizacao de pendencias e atrasos de vacinacao;
- exibicao de campanhas ativas;
- acompanhamento individual por crianca em familias com mais de um filho.

## Estado Atual

Este repositorio esta em construcao incremental, com entregas tecnicas por partes.
A base inicial inclui:
- projeto Ionic com Angular;
- roteamento inicial;
- documentacao tecnica de modelagem de dados e arquitetura.

## Documentacao Tecnica

- [Modelagem de Dados (3FN) e Decisao SQL vs NoSQL](docs/01-modelagem-dados-3fn.md)
- [Esquema SQL de Referencia](docs/sql/schema.sql)

## Stack

- Ionic Framework 8
- Angular 20
- TypeScript

## Como executar

```bash
npm install
npm start
```

## Estrategia de Entrega

1. Fundacao de dados e regras de negocio.
2. Estrutura de telas e navegacao.
3. Indicadores visuais e responsividade.
4. Refinamento de UX, testes e polish final.

## Mock Backend (dados estaticos)

API mock local para servir familias e criancas durante o desenvolvimento do frontend.

### Subir API mock

```bash
npm install
npm run mock:api
```

Servidor padrao: http://localhost:3333

### Endpoints principais

- GET /health
- GET /dashboard
- GET /families
- GET /families/:familyId
- GET /families/:familyId/children
- GET /children
- GET /children?familyId=fam-001
- GET /children?status=OVERDUE
- GET /children/:childId
- GET /children/:childId/vaccination-history
- GET /children/:childId/vaccination-history?status=APPLIED
- GET /children/:childId/vaccination-situation
- GET /children/:childId/pre-vaccination-map
- GET /vaccines
- GET /vaccine-doses
- GET /campaigns
- GET /campaigns/active
- GET /campaigns/active?childId=child-003

## Cenarios cobertos no mock

- Cenario 1: cada crianca retorna resumo com aplicadas, pendentes e atrasadas.
- Cenario 2: status `OVERDUE` e itens vencidos em `/children/:childId/vaccination-situation`.
- Cenario 3: campanhas ativas com filtro por publico alvo em `/campaigns/active`.
- Cenario 4: familias com mais de um filho e situacoes vacinais distintas em `/families`.
