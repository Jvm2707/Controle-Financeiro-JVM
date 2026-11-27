# Política de privacidade

*Última atualização: 26 de novembro de 2026 · válida para a versão 3.0.0 do app*

Esta política descreve como o **Bufunfa** trata as informações de quem o usa. Ela foi escrita a partir do funcionamento real do código, que é público e pode ser conferido no [repositório do projeto](https://github.com/jvm2707/Controle-Financeiro-JVM).

## Resumo

- **O app funciona sem cadastro.** É um conjunto de arquivos estáticos executados no seu navegador.
- **Os dados financeiros ficam no seu aparelho**, no armazenamento local do navegador. O autor não recebe, não vê e não guarda esses dados.
- **A conta é opcional.** Quem cria uma conta para sincronizar entre aparelhos envia ao servidor (Supabase) apenas o **e-mail**, a **senha da conta** (para o login) e o **backup criptografado no próprio aparelho**. A senha de criptografia nunca sai do aparelho, e nem o autor nem o Supabase conseguem ler o backup. Entrar com o Google também é opcional: nesse caso, o Google informa apenas o nome e o e-mail da conta Google.
- **Não há cookies, ferramentas de análise (analytics), anúncios nem rastreamento.**
- Alguns recursos **consultam serviços públicos na internet** (cotações e taxas) ou **enviam uma mensagem quando você usa o formulário de feedback**. Esses envios estão descritos abaixo.

## Onde os dados ficam

| Armazenamento do navegador | O que guarda |
|---|---|
| `localStorage` | Todos os dados financeiros: despesas, receitas, receitas recorrentes, cartões (apelido, final com 4 dígitos, dias de fechamento e vencimento, limite), categorias, orçamentos, metas e aportes, investimentos, aportes e resgates, meta da reserva, exclusões de ocorrências e histórico de importações de extrato. Também guarda preferências (tema, valores ocultos, tela atual, moedas da cotação), a última cotação obtida, imagens de logos que você enviar para os cartões e, se você informar, o token gratuito da Brapi. Com conta, guarda também o e-mail, os tokens de acesso da sessão e a versão e a data da última sincronização. Guarda ainda a data da primeira abertura e quando as sugestões de criar conta foram mostradas ou recusadas, para não repeti-las. |
| `sessionStorage` | Apenas a posição da rolagem da página, por alguns instantes, quando o app é recarregado para aplicar uma atualização. |
| `IndexedDB` | A referência da pasta escolhida para o backup automático e, se você tiver conta e marcar "Lembrar neste aparelho", a chave de criptografia da sincronização, guardada de forma que não pode ser copiada para fora do navegador. Não guarda valores financeiros. |
| Cache do service worker | Os arquivos do próprio app (para funcionar sem internet), inclusive as fontes, e, se você ativar os lembretes, uma lista com o nome, o valor e a data das contas que vencem nos próximos dias, usada para mostrar as notificações no próprio aparelho. |

Esses dados ficam **no navegador e no endereço em que o app foi aberto**. Sem conta, eles não são sincronizados entre aparelhos ou navegadores. Em uma janela anônima, tudo é apagado ao fechar a janela.

## O que sai do seu aparelho

| Situação | Para onde | O que é enviado |
|---|---|---|
| Abrir o app | GitHub Pages (hospedagem) | O pedido dos arquivos do site, como em qualquer página da web. O GitHub pode registrar dados técnicos de acesso, como o endereço IP, conforme a [declaração de privacidade do GitHub](https://docs.github.com/pt/site-policy/privacy-policies/github-general-privacy-statement). |
| Cotações de moedas, taxas e investimentos | Banco Central do Brasil, AwesomeAPI, ExchangeRate-API, CoinGecko, Brapi e Yahoo Finance | Somente códigos públicos (por exemplo `USD-BRL`, `PETR4`, `bitcoin`) e datas. **Valores, saldos e descrições não são enviados.** Na Brapi, o token informado por você acompanha o pedido. |
| Investimento com "Endpoint REST" | O endereço que você mesmo configurar | Um pedido ao endereço informado, feito pelo seu navegador. |
| Criar conta, entrar, sincronizar e apagar a conta (opcional) | Supabase (`qlstbdvlofczlgkjeqbe.supabase.co`), conforme a [política de privacidade do Supabase](https://supabase.com/privacy) | O e-mail e a senha da conta (no cadastro e no login) e o backup **criptografado no aparelho** antes do envio, com os dados técnicos necessários para abri-lo (vetor de inicialização, sal e número da versão). O Supabase registra a data de cada envio. |
| Entrar com Google (opcional) | Google, conforme a [política de privacidade do Google](https://policies.google.com/privacy), e Supabase | O Google confirma sua identidade e informa ao Supabase o e-mail e o nome da conta Google. A senha da conta Google não passa pelo app. A senha de criptografia continua sendo pedida e nunca sai do aparelho. |
| Enviar feedback | Web3Forms, que repassa ao autor por e-mail | O tipo da mensagem, o texto escrito, a versão do app e se o envio foi feito pelo celular ou pelo computador. Nome e e-mail não são pedidos. |

Nenhum desses envios inclui suas despesas, receitas, saldos, metas ou investimentos em forma legível. Na sincronização, eles só saem do aparelho criptografados.

## Backups e exportações

- **Backup:** gera um arquivo `backup-financeiro-AAAA-MM-DD.json` no seu aparelho com todos os dados financeiros. O arquivo **não é criptografado**: guarde-o com o mesmo cuidado que teria com um extrato.
- **Restaurar backup:** lê um arquivo escolhido por você, confere se o formato é válido e substitui os dados atuais, depois de pedir confirmação.
- **Backup automático:** disponível nos navegadores que permitem acesso a pastas (como Chrome e Edge no computador). O app grava o arquivo na pasta que você escolher. Se essa pasta for sincronizada com um serviço de nuvem (Google Drive, OneDrive etc.), a cópia passa a seguir as regras desse serviço.
- **Exportar despesas (CSV) e relatório do mês:** os arquivos são gerados no próprio aparelho, sem envio pela internet.

## Conta e sincronização (opcional)

- **Criptografia de ponta a ponta:** o backup é compactado e criptografado no aparelho com AES-GCM de 256 bits. A chave é derivada da **senha de criptografia** (PBKDF2 com SHA-256, 600 mil iterações e sal aleatório), que é diferente da senha da conta e nunca é enviada.
- **Quem consegue ler:** apenas quem tem a senha de criptografia ou a chave de recuperação. O autor do app e o Supabase guardam só o texto criptografado.
- **Esqueceu a senha de criptografia, perde o backup da nuvem; os dados do aparelho continuam.** A chave de recuperação, exibida no app, permite abrir o backup sem a senha. Guarde-a fora do aparelho.
- **Conflitos:** quando o aparelho e a nuvem foram alterados separadamente, o app pergunta qual versão manter e baixa antes um arquivo de segurança da versão descartada. Esse arquivo não é criptografado.
- **Sair:** encerra a sessão neste aparelho. Os dados do aparelho continuam.
- **Apagar a conta:** o botão "Apagar minha conta e meus dados da nuvem" apaga a conta e o backup do servidor. Os dados do aparelho continuam.

## Notificações

Os lembretes de vencimento são opcionais e gerados pelo próprio navegador, a partir dos dados salvos no aparelho. Não existe servidor de notificações.

## Como apagar seus dados

- No app: **Sobre → Dados do app → Limpar dados deste navegador**, com dupla confirmação.
- Dados da nuvem: **Conta e sincronização → Apagar minha conta e meus dados da nuvem**.
- Pelo navegador: apagar os dados do site `jvm2707.github.io` nas configurações também remove tudo.

A exclusão não pode ser desfeita. Faça um backup antes, se quiser guardar uma cópia.

## Limitações e responsabilidades

- **Os dados guardados no aparelho não são criptografados** (a criptografia vale para o backup enviado à nuvem). Qualquer pessoa com acesso ao seu aparelho e ao seu navegador consegue ver os dados. Use o bloqueio do próprio aparelho.
- Os dados podem ser perdidos se você limpar o navegador, trocar de aparelho sem backup ou se o navegador remover dados do site por falta de espaço. **Fazer backups é responsabilidade de quem usa.**
- O app não tem como recuperar dados apagados nem abrir o backup da nuvem sem a senha de criptografia ou a chave de recuperação, porque o autor não tem cópia legível deles.
- Cotações dependem de serviços de terceiros e podem estar indisponíveis ou atrasadas. Simulações e comparações de taxas são estimativas e não constituem recomendação de investimento.

## Alterações nesta política

Mudanças no funcionamento que afetem a privacidade serão refletidas nesta página e no histórico de versões do app (**Sobre → Novidades e histórico**).

## Contato

Dúvidas sobre privacidade podem ser enviadas pelo formulário descrito na página de [contato](../contact/).
