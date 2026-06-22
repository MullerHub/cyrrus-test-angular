# Regras de Negocio e Cores dos Cards (Resumo para UX/UI)

Este resumo serve como guia rapido para montar o frontend no Lovable e depois converter para Ionic + Angular.

## 1) Regras de negocio essenciais

### 1.1 Status de vacinacao por dose
- `APPLIED`: dose com `appliedDate` preenchida.
- `PENDING`: dose sem `appliedDate` e com `scheduledDate` hoje ou no futuro.
- `OVERDUE`: dose sem `appliedDate` e com `scheduledDate` no passado.

### 1.2 Situacao vacinal da crianca (regra de prioridade)
- Se a crianca tiver pelo menos 1 dose `OVERDUE`, a situacao da crianca e `OVERDUE`.
- Senao, se tiver pelo menos 1 dose `PENDING`, a situacao da crianca e `PENDING`.
- Senao, a situacao da crianca e `APPLIED` (em dia).

### 1.3 Triagem pre-vacinal
- `CLEAR`: fluxo normal de aplicacao.
- `ATTENTION`: exige confirmacao adicional e observacao.
- `BLOCKED`: nao aplicar dose ate nova avaliacao.

### 1.4 Campanhas
- Campanha ativa quando data atual estiver entre `startDate` e `endDate`.
- `remainingDays = max(ceil((endDate - hoje) / 1 dia), 0)`.
- Filtro opcional por crianca: campanha so aparece se idade da crianca estiver entre `targetMinAgeMonths` e `targetMaxAgeMonths`.

### 1.5 Regras de listagem por familia
- Um responsavel pode ter varias criancas.
- Cada crianca deve exibir seu proprio resumo (`APPLIED`, `PENDING`, `OVERDUE`) sem misturar dados com irmaos.

## 2) Regras dos cards da Home (o que cada card mostra)

### 2.1 Cards KPI (topo)
- Familias: total de familias.
- Criancas: total de criancas.
- Doses em atraso: total de doses `OVERDUE`.
- Campanhas ativas: total de campanhas com `active = true`.

### 2.2 Card "Acompanhamento por familia"
- Bloco por familia:
  - Nome da familia.
  - Responsavel e cidade.
  - Badge com quantidade de filhos (`childrenCount`).
- Sub-card por crianca:
  - Nome e idade em meses.
  - Chip com situacao da crianca (`Em dia`, `Pendente`, `Em atraso`).
  - Contadores: `Aplicadas`, `Pendentes`, `Atrasadas`.

### 2.3 Card "Campanhas ativas"
- Titulo da campanha.
- Descricao.
- Publico alvo em meses (`min` a `max`).
- Badge com dias restantes (`remainingDays`).
- Se nao houver campanha ativa: exibir estado vazio.

## 3) Cores principais da identidade

Paleta obrigatoria do projeto:
- Verde principal: `#ABC270`
- Amarelo principal: `#FEC868`
- Laranja principal: `#FDA769`
- Marrom principal: `#473C33`

Mapeamento Ionic atual:
- `primary`: `#ABC270`
- `secondary`: `#FEC868`
- `tertiary`: `#FDA769`
- `dark`: `#473C33`

## 4) Cores dos cards/chips (referencia pronta para UI)

### 4.1 Estrutura geral
- Header: fundo marrom `#473C33` com texto claro.
- Fundo da Home: degrad e suave em tons claros (bege/off-white).
- Cards principais: sombra suave + titulos em marrom.

### 4.2 KPI cards
- Borda com base no verde `#ABC270` (tom claro).
- Texto principal em marrom `#473C33`.
- Valor de "Doses em atraso" puxado para laranja/vermelho (alerta).

### 4.3 Card da familia e sub-card da crianca
- Badge de quantidade de filhos: verde claro (base `#ABC270`) com texto marrom.
- Sub-card da crianca: fundo amarelo muito claro (base `#FEC868`) com borda clara.

### 4.4 Chips de status da crianca
- Em atraso (`OVERDUE`): fundo laranja claro (base `#FDA769`) + texto de alerta escuro.
- Pendente (`PENDING`): fundo amarelo claro (base `#FEC868`) + texto marrom.
- Em dia (`APPLIED`): fundo verde claro (base `#ABC270`) + texto verde escuro.

### 4.5 Card de campanha
- Separadores e badge com base no laranja `#FDA769` em tom claro.
- Texto da campanha em marrom `#473C33`.

## 5) Microcopy sugerida (pt-BR)
- Status da crianca:
  - `APPLIED` -> "Em dia"
  - `PENDING` -> "Pendente"
  - `OVERDUE` -> "Em atraso"
- Estado vazio de campanhas: "Nenhuma campanha ativa no momento."

## 6) Contrato minimo de dados para o layout

Para o frontend UX/UI funcionar, garantir os campos:
- Dashboard: `families`, `children`, `overdue`, `activeCampaigns`.
- Familia: `familyName`, `responsibleName`, `city`, `childrenCount`.
- Crianca: `name`, `ageMonths`, `vaccinationSituation`, `statusSummary`.
- Campanha: `title`, `description`, `targetMinAgeMonths`, `targetMaxAgeMonths`, `remainingDays`, `active`.
