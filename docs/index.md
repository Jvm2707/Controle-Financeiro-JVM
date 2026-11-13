# Documentação do Controle Financeiro JVM

Guia técnico do projeto: tecnologias, estrutura dos arquivos, como executar, como os dados são armazenados e como funcionam o backup e a restauração.

- **Aplicação:** <https://jvm2707.github.io/Controle-Financeiro-JVM/>
- **Repositório:** [github.com/jvm2707/Controle-Financeiro-JVM](https://github.com/jvm2707/Controle-Financeiro-JVM)
- **Versão documentada:** 2.0.1

## Recursos que não existem

Para evitar confusão: o projeto **não oferece API pública, SDK, CLI, servidor MCP, webhooks nem integração bancária**. Não há servidor de aplicação nem banco de dados remoto. Tudo roda no navegador de quem usa. Agentes de IA e ferramentas automatizadas podem **ler** as páginas públicas e os arquivos em Markdown, mas não conseguem consultar nem alterar os dados financeiros de ninguém.

## Tecnologias

| Área | O que é usado |
|---|---|
| Interface | HTML, CSS e JavaScript puros, sem framework e sem etapa de compilação obrigatória |
| Gráficos | SVG desenhado pelo próprio código |
| Dados | `localStorage` do navegador (JSON) |
| Offline e instalação | Service worker (`sw.js`) e Web App Manifest (PWA) |
| Backup automático | File System Access API, com a pasta escolhida guardada no IndexedDB |
| Lembretes | Notifications API e Periodic Background Sync, quando o navegador permite |
| Dados externos | APIs públicas de cotações: Banco Central do Brasil (SGS), AwesomeAPI, ExchangeRate-API, CoinGecko, Brapi e Yahoo Finance |
| Feedback | Web3Forms (envio da mensagem por e-mail ao autor) |
| Fontes | Google Fonts (Geist, Geist Mono, Instrument Serif e Space Grotesk) |
| Hospedagem | GitHub Pages, como site estático |

## Estrutura dos arquivos publicados

```text
/Controle-Financeiro-JVM/
├── index.html              Aplicação (todas as telas)
├── index.md                Descrição da aplicação em Markdown, para agentes
├── Controlefinanceiro.js   Lógica do app
├── Controlefinanceiro.css  Estilos do app
├── sw.js                   Service worker (cache offline e lembretes)
├── manifest.webmanifest    Manifesto do app instalável
├── llms.txt                Guia do projeto para agentes de IA
├── sitemap.xml             Páginas indexáveis
├── 404.html                Página de erro "não encontrada"
├── .nojekyll               Publica os arquivos como estão (sem Jekyll)
├── about/                  Sobre (index.html e index.md)
├── contact/                Contato (index.html e index.md)
├── privacy/                Política de privacidade (index.html e index.md)
├── docs/                   Esta documentação (index.html e index.md)
└── assets/                 Imagens, ícones, fundos e o estilo das páginas institucionais
```

Na publicação, o JavaScript e o CSS do app vão minificados. A versão legível fica com o autor. Os arquivos `index.md` têm o mesmo conteúdo das páginas HTML correspondentes.

## Como executar

O app não precisa de instalação nem de dependências. Para rodar uma cópia local:

1. Baixe ou clone o repositório.
2. Sirva a pasta com qualquer servidor estático. Por exemplo:

```bash
python -m http.server 8080
# ou
npx serve .
```

3. Abra `http://localhost:8080/` no navegador.

Abrir o `index.html` direto do disco (`file://`) também funciona para o uso básico, mas o service worker, a instalação como app e os lembretes só funcionam em `http://localhost` ou em HTTPS.

Os dados de uma cópia local ficam separados dos dados do site oficial, porque o navegador separa o armazenamento por endereço.

## Armazenamento local

Cada conjunto de dados é salvo como texto JSON em uma chave do `localStorage`. As principais:

| Chave | Conteúdo |
|---|---|
| `gastos` | Despesas: únicas, ocorrências de recorrentes e parcelas |
| `receitas` | Receitas por mês, com os lançamentos de cada uma |
| `receitasFixas` | Receitas recorrentes e o histórico de reajustes |
| `cartoes` | Cartões: apelido, final, dias de fechamento e vencimento, limite e aparência |
| `categorias` e `orcamentos` | Categorias e limite mensal de cada uma |
| `metas` | Metas com aportes |
| `investimentos`, `aportesInvestimentos`, `resgatesInvestimentos` | Carteira de investimentos e movimentações |
| `metaReservaGeral` | Valor-alvo da reserva de emergência |
| `ocorrenciasExcluidas` | Ocorrências de recorrentes apagadas (para não serem recriadas) |
| `importacoesExtrato` | Registro das importações de OFX e CSV (evita duplicidade) |
| `cacheApi` | Últimas cotações obtidas, para uso offline |

Também há chaves de preferência (por exemplo `tema`, `ocultarValores`, `secaoAtual`) e de estado da interface. Se o conteúdo de uma chave estiver danificado, o app guarda uma cópia com o sufixo `_corrompido` e continua funcionando.

As despesas recorrentes são mantidas com 12 meses de ocorrências à frente. Cada ocorrência guarda a data em que foi gerada, o que impede duplicidade ao editar datas.

## Backup e restauração

- **Fazer backup** (tela Backup) gera `backup-financeiro-AAAA-MM-DD.json` com receitas, receitas recorrentes, despesas, metas, investimentos, aportes, resgates, meta da reserva, exclusões de ocorrências, categorias, orçamentos e cartões. O arquivo leva o campo `versao` (formato atual: 15) e a data de geração.
- **Restaurar backup** valida o arquivo (listas obrigatórias, datas no formato `AAAA-MM-DD`, valores numéricos positivos) e substitui os dados atuais depois da confirmação. Backups de versões anteriores continuam aceitos.
- **Backup automático** grava `backup-auto-financeiro-AAAA-MM-DD.json` na pasta escolhida, nos navegadores com suporte à File System Access API (Chrome e Edge no computador).
- **Exportar despesas** gera um CSV que abre no Excel ou no Google Planilhas. **Relatório do mês** abre a impressão, de onde é possível salvar em PDF.

O arquivo de backup não é criptografado.

## Atualizações e cache

Cada publicação muda o parâmetro `?v=` dos arquivos JS e CSS e a constante `VERSAO` do `sw.js`. Assim, quem já instalou o app recebe os arquivos novos, e os caches antigos são apagados.

## Segurança

- A página do app declara uma Content-Security-Policy que só permite scripts do próprio site.
- Textos digitados pelo usuário são inseridos como texto, não como HTML.
- Não há cookies nem ferramentas de rastreamento.

## Como contribuir

O repositório é público e o histórico de alterações pode ser acompanhado pelos commits. Sugestões e relatos de problemas podem ser enviados pelo formulário **Contato e feedback**, dentro do app (veja a página de [contato](../contact/)).

O repositório não declara uma licença de uso. Antes de reutilizar o código em outro projeto, consulte o autor.

## Páginas relacionadas

- [Sobre o projeto](../about/)
- [Política de privacidade](../privacy/)
- [Guia para agentes de IA (llms.txt)](../llms.txt)
- [Mapa do site (sitemap.xml)](../sitemap.xml)
