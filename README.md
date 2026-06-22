# Cyrrus Test Angular - Vacinacao Infantil

Aplicacao Ionic + Angular para acompanhamento da jornada vacinal infantil.

## Objetivo

Entregar uma solucao digital simples e intuitiva para:
- acompanhamento de criancas;
- consulta de historico vacinal;
- visualizacao de pendencias e atrasos de vacinacao;
- exibicao de campanhas ativas;
- acompanhamento individual por crianca em familias com mais de um filho.

## Estado Atual da Entrega

Este repositorio foi estruturado em etapas, com foco em regras de negocio, base de dados e contrato de API antes da construcao completa das telas.

## 1) Regras de Negocio (concluidas)

As principais regras de negocio do desafio foram mapeadas e documentadas:
- Status vacinal por dose: `APPLIED`, `PENDING`, `OVERDUE`.
- Identificacao de pendencias por prazo vencido.
- Separacao de historico por crianca para familias com mais de um filho.
- Campanhas de vacinacao ativas com filtro por publico infantil.
- Triagem pre-vacinal com recomendacao `CLEAR`, `ATTENTION` e `BLOCKED`.

Base de referencia:
- [Modelagem de Dados (3FN) e Decisao SQL vs NoSQL](docs/01-modelagem-dados-3fn.md)
- [Esquema SQL de Referencia](docs/sql/schema.sql)

## 2) Diagrama Visual (concluido)

Diagrama de visao geral com fluxo de uso e entidades do dominio:
- [Diagrama Visual do Modelo de Negocio](docs/00-diagrama-visao-geral.md)

## 3) Backend Mocado (concluido)

Foi implementada uma mock API em Node.js + Express para suportar o frontend com dados estaticos, seguindo a logica de negocio definida nos docs.

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

### Cenarios cobertos no mock

- Cenario 1: cada crianca retorna resumo com aplicadas, pendentes e atrasadas.
- Cenario 2: status `OVERDUE` e itens vencidos em `/children/:childId/vaccination-situation`.
- Cenario 3: campanhas ativas com filtro por publico alvo em `/campaigns/active`.
- Cenario 4: familias com mais de um filho e situacoes vacinais distintas em `/families`.

## 4) Frontend (iniciando agora)

O frontend entra na fase de implementacao de telas com Ionic + Angular, seguindo boas praticas e arquitetura limpa:
- separacao por camadas (core, domain, feature, shared);
- componentes reutilizaveis;
- services orientados a contrato de API;
- interfaces tipadas para o dominio vacinal;
- foco em responsividade (mobile, tablet e desktop).

## Direcao de Design (paleta obrigatoria)

As cores principais da aplicacao sao:
- `#ABC270`
- `#FEC868`
- `#FDA769`
- `#473C33`

Essas cores serao aplicadas na identidade visual das telas, indicadores e elementos de destaque.

## Stack

- Ionic Framework 8
- Angular 20
- TypeScript

## Como executar

```bash
npm install
npm start
```
