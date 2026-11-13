# Política de privacidade

*Última atualização: 12 de novembro de 2026 · válida para a versão 2.0.2 do app*

Esta política descreve como o **Controle Financeiro JVM** trata as informações de quem o usa. Ela foi escrita a partir do funcionamento real do código, que é público e pode ser conferido no [repositório do projeto](https://github.com/jvm2707/Controle-Financeiro-JVM).

## Resumo

- **Não há cadastro, conta, login nem servidor próprio.** O app é um conjunto de arquivos estáticos hospedados no GitHub Pages e executados no seu navegador.
- **Os dados financeiros ficam no seu aparelho**, no armazenamento local do navegador. O autor não recebe, não vê e não guarda esses dados.
- **Não há cookies, ferramentas de análise (analytics), anúncios nem rastreamento.**
- Alguns recursos **consultam serviços públicos na internet** (cotações e fontes) ou **enviam uma mensagem quando você usa o formulário de feedback**. Esses envios estão descritos abaixo.

## Onde os dados ficam

| Armazenamento do navegador | O que guarda |
|---|---|
| `localStorage` | Todos os dados financeiros: despesas, receitas, receitas recorrentes, cartões (apelido, final com 4 dígitos, dias de fechamento e vencimento, limite), categorias, orçamentos, metas e aportes, investimentos, aportes e resgates, meta da reserva, exclusões de ocorrências e histórico de importações de extrato. Também guarda preferências (tema, valores ocultos, tela atual, moedas da cotação), a última cotação obtida, imagens de logos que você enviar para os cartões e, se você informar, o token gratuito da Brapi. |
| `sessionStorage` | Apenas a posição da rolagem da página, por alguns instantes, quando o app é recarregado para aplicar uma atualização. |
| `IndexedDB` | Apenas a referência da pasta escolhida para o backup automático (não guarda valores financeiros). |
| Cache do service worker | Os arquivos do próprio app (para funcionar sem internet), as fontes e, se você ativar os lembretes, uma lista com o nome, o valor e a data das contas que vencem nos próximos dias, usada para mostrar as notificações no próprio aparelho. |

Esses dados ficam **no navegador e no endereço em que o app foi aberto**. Eles não são sincronizados entre aparelhos ou navegadores. Em uma janela anônima, tudo é apagado ao fechar a janela.

## O que sai do seu aparelho

| Situação | Para onde | O que é enviado |
|---|---|---|
| Abrir o app | GitHub Pages (hospedagem) | O pedido dos arquivos do site, como em qualquer página da web. O GitHub pode registrar dados técnicos de acesso, como o endereço IP, conforme a [declaração de privacidade do GitHub](https://docs.github.com/pt/site-policy/privacy-policies/github-general-privacy-statement). |
| Carregar as fontes | Google Fonts | O pedido das fontes Geist, Geist Mono, Instrument Serif e Space Grotesk. O Google recebe dados técnicos da conexão, como o endereço IP. |
| Cotações de moedas, taxas e investimentos | Banco Central do Brasil, AwesomeAPI, ExchangeRate-API, CoinGecko, Brapi e Yahoo Finance | Somente códigos públicos (por exemplo `USD-BRL`, `PETR4`, `bitcoin`) e datas. **Valores, saldos e descrições não são enviados.** Na Brapi, o token informado por você acompanha o pedido. |
| Investimento com "Endpoint REST" | O endereço que você mesmo configurar | Um pedido ao endereço informado, feito pelo seu navegador. |
| Enviar feedback | Web3Forms, que repassa ao autor por e-mail | O tipo da mensagem, o texto escrito, a versão do app e se o envio foi feito pelo celular ou pelo computador. Nome e e-mail não são pedidos. |

Nenhum desses envios inclui suas despesas, receitas, saldos, metas ou investimentos.

## Backups e exportações

- **Backup:** gera um arquivo `backup-financeiro-AAAA-MM-DD.json` no seu aparelho com todos os dados financeiros. O arquivo **não é criptografado**: guarde-o com o mesmo cuidado que teria com um extrato.
- **Restaurar backup:** lê um arquivo escolhido por você, confere se o formato é válido e substitui os dados atuais, depois de pedir confirmação.
- **Backup automático:** disponível nos navegadores que permitem acesso a pastas (como Chrome e Edge no computador). O app grava o arquivo na pasta que você escolher. Se essa pasta for sincronizada com um serviço de nuvem (Google Drive, OneDrive etc.), a cópia passa a seguir as regras desse serviço.
- **Exportar despesas (CSV) e relatório do mês:** os arquivos são gerados no próprio aparelho, sem envio pela internet.

## Notificações

Os lembretes de vencimento são opcionais e gerados pelo próprio navegador, a partir dos dados salvos no aparelho. Não existe servidor de notificações.

## Como apagar seus dados

- No app: **Sobre → Dados do app → Limpar dados deste navegador**, com dupla confirmação.
- Pelo navegador: apagar os dados do site `jvm2707.github.io` nas configurações também remove tudo.

A exclusão não pode ser desfeita. Faça um backup antes, se quiser guardar uma cópia.

## Limitações e responsabilidades

- **Não há proteção por senha ou criptografia dentro do app.** Qualquer pessoa com acesso ao seu aparelho e ao seu navegador consegue ver os dados. Use o bloqueio do próprio aparelho.
- Os dados podem ser perdidos se você limpar o navegador, trocar de aparelho sem backup ou se o navegador remover dados do site por falta de espaço. **Fazer backups é responsabilidade de quem usa.**
- O app não tem como recuperar dados apagados, porque o autor não tem cópia deles.
- Cotações dependem de serviços de terceiros e podem estar indisponíveis ou atrasadas. Simulações e comparações de taxas são estimativas e não constituem recomendação de investimento.

## Alterações nesta política

Mudanças no funcionamento que afetem a privacidade serão refletidas nesta página e no histórico de versões do app (**Sobre → Novidades e histórico**).

## Contato

Dúvidas sobre privacidade podem ser enviadas pelo formulário descrito na página de [contato](../contact/).
