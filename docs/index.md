# Documentação do Bufunfa

Guia técnico do projeto: tecnologias, estrutura dos arquivos, como executar, como os dados são armazenados e como funcionam o backup e a restauração.

- **Aplicação:** <https://jvm2707.github.io/Controle-Financeiro-JVM/>
- **Repositório:** [github.com/jvm2707/Controle-Financeiro-JVM](https://github.com/jvm2707/Controle-Financeiro-JVM)
- **Versão documentada:** 3.0.0

## Recursos que não existem

Para evitar confusão: o projeto **não oferece API própria, SDK, CLI, servidor MCP, webhooks nem integração bancária**. Ele apenas consome APIs públicas de cotações e taxas (listadas abaixo). Não há servidor de aplicação próprio. Tudo roda no navegador de quem usa; a única exceção é a conta opcional, em que o Supabase guarda o e-mail e um backup criptografado no aparelho, que ninguém além da pessoa consegue abrir. Agentes de IA e ferramentas automatizadas podem **ler** as páginas públicas e os arquivos em Markdown, mas não conseguem consultar nem alterar os dados financeiros de ninguém.

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
| Conta e sincronização (opcional) | Supabase (Auth e tabela `backups` com RLS), chamado pela API REST com `fetch`, sem SDK; criptografia com Web Crypto (PBKDF2 + AES-GCM) e compactação com `CompressionStream` |
| Feedback | Web3Forms (envio da mensagem por e-mail ao autor) |
| Fontes | Geist, Geist Mono, Instrument Serif e Space Grotesk (licença OFL), hospedadas no próprio site em `assets/fontes/` |
| Hospedagem | GitHub Pages, como site estático |

## Estrutura dos arquivos publicados

```text
/Controle-Financeiro-JVM/
├── index.html              Página inicial (apresentação; quem já usa o app vai direto para app/)
├── landing.js              Decide, antes de pintar, se a visita vai direto para o app
├── app/index.html          Aplicação (todas as telas)
├── entrar/, criar-conta/   Entrar e criar conta (formulários do Controlefinanceiro-nuvem.js, sem o JS do app)
├── conta.css               Visual dessas duas páginas
├── transicao.js            Transição entre a landing e as páginas de conta (o botão vira o cartão)
├── rendimento.js           Catálogo de bancos e cálculo de rendimento (app e simulador da landing)
├── elastico.js             Efeito elástico nas bordas da página (app e landing)
├── index.md                Descrição da aplicação em Markdown, para agentes
├── Controlefinanceiro.js   Lógica do app
├── Controlefinanceiro-sobre.js  Histórico de versões da tela Sobre (carregado ao abrir o Sobre)
├── Controlefinanceiro-nuvem.js  Conta e sincronização (carregado ao abrir a conta ou se houver sessão)
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
└── assets/                 Imagens, ícones, fundos, fontes e o estilo das páginas institucionais
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

Abrir o `app/index.html` direto do disco (`file://`) também funciona para o uso básico, mas o service worker, a instalação como app e os lembretes só funcionam em `http://localhost` ou em HTTPS.

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

## Conta e sincronização (opcional)

- **O que vai para o servidor:** o e-mail e a senha da conta (Supabase Auth, com confirmação por e-mail) e uma linha na tabela `backups` com `dados_cifrados`, `iv`, `sal` e `versao`. Cada pessoa só lê e altera a própria linha (Row Level Security).
- **Entrar com Google (opcional):** pelo OAuth do Supabase (`/auth/v1/authorize?provider=google`). O botão só aparece quando o provedor está ativo no painel (`/auth/v1/settings`). A senha de criptografia continua obrigatória.
- **Criptografia:** o mesmo JSON do backup é compactado (gzip) e criptografado no aparelho com AES-GCM de 256 bits e um vetor de inicialização novo a cada envio. A chave vem de PBKDF2 com SHA-256, 600 mil iterações e sal aleatório de 16 bytes, a partir da senha de criptografia, que é diferente da senha da conta e nunca é enviada. A chave de recuperação é a própria chave em Base64.
- **Limite:** o backup criptografado precisa caber em 5 MB; acima disso, o app avisa e não envia.
- **Quando sincroniza:** ao entrar, quando a internet volta, ao voltar para a aba e 5 segundos depois de uma alteração nos dados. Só a aba visível envia.
- **Conflitos:** o envio só é aceito se a nuvem ainda estiver na versão conhecida pelo aparelho. Se os dois lados mudaram, o app pergunta qual manter e baixa antes um arquivo de segurança da versão descartada (`backup-financeiro-AAAA-MM-DD-antes-da-nuvem.json` ou `-antes-do-aparelho.json`).
- **Senha de criptografia errada:** nada é enviado nem recriado. Substituir a nuvem só pelo botão "Começar do zero na nuvem", com confirmação e arquivo de segurança antes.
- **Sugestões de conta:** no máximo uma a cada 7 dias; "Agora não" adia aquela sugestão por 14 dias e, depois de 3 recusas seguidas, elas param. O controle fica em `ofertasConta` e `primeiroUso` no `localStorage` (fora do backup).
- **Chaves locais:** `nuvemSessao` (e-mail e tokens), `nuvemVersao`, `nuvemAlterado` e `nuvemUltima` no `localStorage`; a chave, se lembrada, fica no IndexedDB `bufunfa-nuvem` como chave não exportável.

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
