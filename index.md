# Bufunfa

Bufunfa (antigo Controle Financeiro JVM): aplicação web gratuita de **controle financeiro pessoal**, em português do Brasil, para organizar despesas, receitas, cartões de crédito, metas, reserva de emergência e investimentos. Funciona no navegador, sem cadastro, e guarda os dados no aparelho de quem usa.

- **Abrir o app:** <https://jvm2707.github.io/Controle-Financeiro-JVM/>
- **Versão:** 2.1.0 (novembro de 2026)
- **Preço:** gratuito, sem anúncios e sem assinatura
- **Idioma e moeda:** português (Brasil), valores em reais (R$)
- **Autor:** JVM ([github.com/jvm2707](https://github.com/jvm2707))

## Para que serve

Para quem quer acompanhar o próprio dinheiro mês a mês: quanto entrou, quanto saiu, o que ainda vence, quanto já está comprometido no cartão e quanto falta para cada objetivo. É uma ferramenta de **uso pessoal**. Não é banco, corretora nem consultoria, não movimenta dinheiro e não se conecta a contas bancárias.

## Principais funcionalidades

- **Início:** saldo acumulado, receitas e despesas do mês, previsão de saldo no fim do mês, vencimentos em linha do tempo, orçamento por categoria, metas, cotação de moedas e últimos lançamentos.
- **Despesas:** únicas, recorrentes (com pausa) ou parceladas; Pix, débito, dinheiro, boleto ou cartão de crédito; categorias com limite de orçamento; edição e exclusão em série; seleção múltipla; importação de extratos OFX e CSV.
- **Cartões de crédito:** fatura atual, limite usado, melhor dia de compra, próximas faturas e pagamento da fatura inteira.
- **Receitas:** receitas do mês e recorrentes com reajuste.
- **Metas:** objetivos com valor, prazo, aportes e valor mensal sugerido.
- **Reserva e investimentos:** reserva de emergência, simulador de evolução, comparação de taxas de bancos, cadastro por banco e produto (com faixas de rendimento, como "115% do CDI até R$ 5 mil"), carteira com cotações públicas e resgates com estimativa de IR e IOF.
- **Relatórios:** evolução anual e semestral, balanço do mês, despesas por categoria, comparação entre meses e relatório mensal.
- **Backup e exportação:** arquivo de backup, restauração, backup automático em pasta, CSV das despesas e relatório para PDF.
- **App instalável (PWA):** funciona sem internet depois de aberto uma vez e pode avisar sobre vencimentos.

## Como usar

1. Abra o endereço do app no navegador do computador ou do celular.
2. Na primeira visita, um tutorial curto e uma configuração inicial ajudam a cadastrar a receita e as contas fixas.
3. Lance despesas, compras no cartão, receitas e aportes pelo botão **+**. As listas ficam em **Lançamentos** (Todos, Despesas, Receitas e Cartões).
4. Cadastre os cartões em **Lançamentos → Cartões** para que as compras caiam na fatura certa.
5. Faça backups periódicos em **Backup** (no menu **Mais**, no celular, ou no menu lateral, no computador), principalmente antes de trocar de aparelho ou limpar o navegador.

## Como os dados são armazenados

Os dados ficam no `localStorage` do navegador, no próprio aparelho. Não há servidor, conta nem sincronização. O autor não tem acesso aos dados. Para usar em outro aparelho, é preciso exportar um backup e restaurá-lo lá. Detalhes na [política de privacidade](https://jvm2707.github.io/Controle-Financeiro-JVM/privacy/).

## Limitações

- Não há sincronização entre aparelhos nem acesso por login.
- Não há proteção por senha dentro do app. O backup é um arquivo JSON sem criptografia.
- Limpar os dados do navegador apaga os dados do app.
- Cotações dependem de serviços públicos de terceiros e podem falhar.
- O app não oferece API própria, SDK, CLI ou servidor MCP. Ele apenas consulta APIs públicas de cotações e taxas (Banco Central do Brasil, AwesomeAPI, ExchangeRate-API, CoinGecko, Brapi e Yahoo Finance), enviando só códigos e datas.
- Simulações são estimativas e não constituem recomendação de investimento.

## Mais informações

- [Sobre o projeto](https://jvm2707.github.io/Controle-Financeiro-JVM/about/)
- [Documentação](https://jvm2707.github.io/Controle-Financeiro-JVM/docs/)
- [Política de privacidade](https://jvm2707.github.io/Controle-Financeiro-JVM/privacy/)
- [Contato](https://jvm2707.github.io/Controle-Financeiro-JVM/contact/)
- [Guia para agentes de IA (llms.txt)](https://jvm2707.github.io/Controle-Financeiro-JVM/llms.txt)
- [Código-fonte no GitHub](https://github.com/jvm2707/Controle-Financeiro-JVM)
