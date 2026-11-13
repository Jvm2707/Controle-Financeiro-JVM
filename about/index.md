# Sobre o Controle Financeiro JVM

O **Controle Financeiro JVM** é uma aplicação web gratuita de **controle financeiro pessoal**, em português do Brasil, para organizar despesas, receitas, cartões de crédito, metas e investimentos em um só lugar. Ela funciona direto no navegador, sem cadastro e sem conta, e guarda os dados no próprio aparelho de quem usa.

- **Endereço oficial:** <https://jvm2707.github.io/Controle-Financeiro-JVM/>
- **Versão atual:** 2.0.2 (novembro de 2026)
- **Autor:** JVM ([perfil no GitHub](https://github.com/jvm2707))
- **Código-fonte:** [github.com/jvm2707/Controle-Financeiro-JVM](https://github.com/jvm2707/Controle-Financeiro-JVM)

## Objetivo do projeto

O objetivo é oferecer uma ferramenta simples para quem quer **saber para onde vai o dinheiro do mês**, sem precisar criar conta, conectar o banco ou entregar informações financeiras para um serviço de terceiros. O app foi pensado para o uso pessoal do dia a dia: lançar um gasto, conferir quanto ainda sobra no mês, acompanhar a fatura do cartão e planejar objetivos.

## O problema que ele resolve

Planilhas exigem montar fórmulas e manter tudo à mão. Muitos aplicativos de finanças, por outro lado, pedem cadastro, acesso à conta bancária ou assinatura. O Controle Financeiro JVM fica no meio do caminho: tem cálculos prontos (parcelas, faturas, recorrências, rendimento), mas mantém o controle e os dados com a própria pessoa.

## Principais funcionalidades

- **Início:** saldo acumulado, receitas e despesas do mês, previsão de saldo no fim do mês, vencimentos em linha do tempo, orçamento por categoria, metas, cotação de moedas e últimas movimentações.
- **Despesas:** cadastro de despesas únicas, recorrentes (com pausa e retomada) e parceladas; forma de pagamento (Pix, débito, dinheiro, boleto ou cartão de crédito); categorias com limite de orçamento; edição e exclusão em série; seleção de várias despesas de uma vez; importação de extratos OFX e CSV.
- **Cartões:** fatura atual, limite usado e disponível, melhor dia de compra, próximas faturas e pagamento da fatura inteira.
- **Receitas:** receitas do mês e receitas recorrentes com reajuste de valor.
- **Metas:** objetivos com valor e prazo, aportes e plano de quanto guardar por mês.
- **Reserva e investimentos:** reserva de emergência, simulador de evolução, comparação de taxas ("Onde render mais"), investimentos com cotações públicas e resgates com estimativa de IR e IOF.
- **Relatórios:** evolução anual e semestral, balanço do mês, despesas por categoria, comparação entre meses, assinaturas e relatório mensal.
- **Backup e exportação:** backup e restauração em arquivo, backup automático em uma pasta do computador, exportação das despesas em CSV e relatório do mês para imprimir ou salvar em PDF.
- **App instalável:** pode ser instalado no celular ou no computador (PWA), funciona sem internet depois de aberto uma vez e pode lembrar vencimentos por notificação.

## Tecnologias

HTML, CSS e JavaScript puros, sem framework e sem servidor próprio. Os dados ficam no armazenamento local do navegador (`localStorage`). Os gráficos são desenhados em SVG, e o funcionamento offline usa um service worker. O site é hospedado no GitHub Pages. Os detalhes estão na [documentação](../docs/).

## O que o projeto não é

O Controle Financeiro JVM **não é um banco, uma corretora nem uma consultoria financeira**. Ele não movimenta dinheiro, não se conecta a contas bancárias e não oferece uma API pública. As simulações e comparações de taxas são estimativas e não constituem recomendação de investimento.

## Páginas relacionadas

- [Política de privacidade](../privacy/): como os dados são armazenados e o que sai do aparelho.
- [Contato](../contact/): como enviar sugestões e relatar problemas.
- [Documentação](../docs/): estrutura do projeto, armazenamento e backup.
