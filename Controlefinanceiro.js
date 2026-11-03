// 1. Elementos da receita
const formReceita = document.getElementById("form-receita");
const campoReceita = document.getElementById("receitames");
const campoMesReceita = document.getElementById("mes-receita");
const totalReceita = document.getElementById("total-receita");
const campoDescricaoReceita = document.getElementById("descricao-receita");

// 1.1 Elemento do filtro mensal
const filtroMes = document.getElementById("filtro-mes");

let dataAtual = new Date();
let ano = dataAtual.getFullYear();
let mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
let mesAtual = `${ano}-${mes}`;

filtroMes.value = mesAtual;

// 1.2 Lista que guardará as receitas registradas
let receitas = JSON.parse(localStorage.getItem("receitas")) || [];

// 2. Formulário da receita
// 2.0 Cada mês guarda o total (valor) e a lista dos lançamentos que o formam
function lancamentosDaReceita(receita) {
    if (Array.isArray(receita.lancamentos)) {
        return receita.lancamentos;
    }

    // Receitas antigas: o valor do mês é um único lançamento
    return [{
        valor: Number(receita.valor),
        descricao: receita.descricao || "",
        registradoEm: receita.registradoEm || 0
    }];
}

// modo "novo": soma ao mês (ou cria o mês); modo "ajustar": reescreve o total
function salvarReceita(modo) {
    const receitaNumero = Number(campoReceita.value);

    if (!Number.isFinite(receitaNumero) || receitaNumero <= 0) {
        mostrarAviso("Informe uma receita válida maior que zero.");
        return;
    }

    const mesReceita = campoMesReceita.value;

    if (!mesReceita) {
        mostrarAviso("Selecione o mês da receita.");
        return;
    }

    const descricaoReceita = campoDescricaoReceita.value.trim();
    const lancamento = {
        valor: receitaNumero,
        descricao: descricaoReceita,
        registradoEm: Date.now()
    };

    const receitaExistente = receitas.find(function(receita) {
        return receita.mes === mesReceita;
    });

    if (!receitaExistente) {
        receitas.push({
            mes: mesReceita,
            valor: receitaNumero,
            descricao: descricaoReceita,
            registradoEm: lancamento.registradoEm,
            lancamentos: [lancamento]
        });
    } else if (modo === "ajustar") {
        receitaExistente.valor = receitaNumero;
        receitaExistente.descricao = descricaoReceita;
        receitaExistente.registradoEm = lancamento.registradoEm;
        receitaExistente.lancamentos = [lancamento];
    } else {
        const lista = lancamentosDaReceita(receitaExistente).slice();

        lista.push(lancamento);
        receitaExistente.lancamentos = lista;
        receitaExistente.valor = lista.reduce(function(soma, item) {
            return soma + (Number(item.valor) || 0);
        }, 0);
        receitaExistente.registradoEm = lancamento.registradoEm;
    }

    localStorage.setItem("receitas", JSON.stringify(receitas));

    filtroMes.value = mesReceita;
    atualizarHistorico();
    atualizarResumoMensal();
    atualizarSaldo();
    fecharModalReceita();
}

formReceita.onsubmit = function(event) {
    event.preventDefault();

    // Enter só salva sozinho quando o mês ainda não tem receita
    const jaTem = receitas.some(function(receita) {
        return receita.mes === campoMesReceita.value;
    });

    if (!jaTem) {
        salvarReceita("novo");
    }
};

// 3. Elementos das despesas
const formGasto = document.getElementById("form-gasto");
const campoDescricao = document.getElementById("descricao");
const campoValor = document.getElementById("valor");
const campoData = document.getElementById("data");
const campoCategoria = document.getElementById("categoria");

// 3.1.1 Elementos da despesa recorrente
const despesaRecorrente = document.getElementById("despesa-recorrente");
const camposRecorrencia = document.getElementById("campos-recorrencia");
const frequenciaRecorrencia = document.getElementById("frequencia-recorrencia");
const diaVencimento = document.getElementById("dia-vencimento");

const listaGastos = document.getElementById("lista-gastos");
const totalDespesa = document.getElementById("total-despesa");
const totalDespesasPeriodo = document.getElementById("total-despesas-periodo");
const contasPendentes = document.getElementById("contas-pendentes");
const periodoDespesas = document.getElementById("periodo-despesas");
const filtroMesDespesas = document.getElementById("filtro-mes-despesas");
const contagemDespesas = document.getElementById("contagem-despesas");
const listaHistorico = document.getElementById("lista-historico");
const mensagemDespesa = document.getElementById("mensagem-despesa");

// 3.1 Lista que guardará as despesas registradas
let gastos = JSON.parse(localStorage.getItem("gastos")) || [];

// 3.2 Guardar as ocorrências recorrentes excluídas
let ocorrenciasExcluidas = JSON.parse(
    localStorage.getItem("ocorrenciasExcluidas")
) || [];

// 4. Formulário das despesas

// Exibir ou ocultar os campos de recorrência
despesaRecorrente.addEventListener("change", function() {
    camposRecorrencia.hidden = !despesaRecorrente.checked;

    frequenciaRecorrencia.required = despesaRecorrente.checked;
    diaVencimento.required = despesaRecorrente.checked;
});

formGasto.onsubmit = function(event) {
    event.preventDefault();

    // 4.1 Pegar os valores digitados
    let descricao = campoDescricao.value;
    let gastoValor = campoValor.value;
    let data = campoData.value;
    let categoria = campoCategoria.value;

    // 4.2 Guardar a despesa como número
    gastoValor = Number(gastoValor);
    if (!Number.isFinite(gastoValor) || gastoValor <= 0) {
        mostrarAviso("Informe um valor válido maior que zero.");
        return;
    }

    // 4.2.1 Validar a descrição e a data da despesa
    if (!descricao.trim() || !data || !categoria.trim()) {
        mostrarAviso("Informe a descrição, a data e a categoria da despesa.");
        return;
    }

    // 4.2.2 Compra no cartão parcelado: cria uma despesa por parcela
    if (tipoPagamentoAtual() === "parcelado") {
        const totalParcelas = Math.floor(Number(numParcelas.value));

        if (!(totalParcelas >= 2 && totalParcelas <= 60)) {
            mostrarAviso("Informe o número de parcelas (de 2 a 60).");
            return;
        }

        cadastrarCompraParcelada(descricao.trim(), gastoValor, data, categoria.trim(), totalParcelas);
        localStorage.setItem("gastos", JSON.stringify(gastos));

        filtroMes.value = data.slice(0, 7);
        atualizarHistorico();

        formGasto.reset();
        campoData.value = dataDeHoje();
        aplicarTipoPagamento();
        mostrarMensagemDespesa(`Compra parcelada em ${totalParcelas}x cadastrada com sucesso!`);

        atualizarResumoMensal();
        atualizarSaldo();
        return;
    }

    // 4.3 Criar um objeto com os dados da despesa
    let novaDespesa = {
        id: Date.now(),
        modeloRecorrencia: despesaRecorrente.checked,
        descricao: descricao.trim(),
        valor: gastoValor,
        data: data,
        categoria: categoria.trim(),
        paga: false,
        recorrente: despesaRecorrente.checked,
        frequencia: despesaRecorrente.checked
            ? frequenciaRecorrencia.value
            : null,
        diaVencimento: despesaRecorrente.checked
            ? Number(diaVencimento.value)
            : null
    };

    // 4.4 Guardar a despesa na lista
    gastos.push(novaDespesa);

    // 4.4.1 Criar as próximas ocorrências, se for recorrente
    criarProximaOcorrencia(novaDespesa);

    localStorage.setItem("gastos", JSON.stringify(gastos));

    // 4.5 Selecionar o mês da despesa cadastrada
    filtroMes.value = data.slice(0, 7);

    // 4.6 Atualizar o histórico de despesas
    atualizarHistorico();

    // 4.7 Limpar o formulário
    formGasto.reset();
    campoData.value = dataDeHoje();
    aplicarTipoPagamento();
    mostrarMensagemDespesa("Despesa cadastrada com sucesso!");

    // 4.8 Atualizar o resumo mensal
    atualizarResumoMensal();

    // 4.9 Atualizar saldo restante
    atualizarSaldo();
};


// 4.10 Categorias personalizadas

// 4.10.1 Lista que guardará as categorias
let categorias = JSON.parse(localStorage.getItem("categorias")) || [];

// 4.10.2 Orçamento mensal por categoria (opcional)
// Guarda um objeto assim: { "Alimentação": 600, "Lazer": 300 }
let orcamentos = JSON.parse(localStorage.getItem("orcamentos")) || {};

function salvarOrcamentos() {
    localStorage.setItem("orcamentos", JSON.stringify(orcamentos));
}

// 4.10.3 Elementos da tela de categorias
const formCategoria = document.getElementById("form-categoria");
const campoNovaCategoria = document.getElementById("nova-categoria");
const campoOrcamentoCategoria = document.getElementById("orcamento-categoria");
const listaCategorias = document.getElementById("lista-categorias");
const filtroHistoricoCategoria = document.getElementById("filtro-historico-categoria");

// 4.10.4 Ícones usados nos botões das listas
const ICONES = {
    editar: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
    excluir: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    orcamento: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    pausar: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    retomar: '<polygon points="6 3 20 12 6 21 6 3"/>'
};

function criarBotaoIcone(icone, rotulo, aoClicar) {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = "botao-icone";

    // Editar e excluir ganham um estilo próprio (cor do ícone e da borda)
    if (icone === "editar" || icone === "excluir") {
        botao.classList.add("botao-icone-" + icone);
    }
    botao.title = rotulo;
    botao.setAttribute("aria-label", rotulo);
    botao.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[icone]}</svg>`;

    botao.addEventListener("click", aoClicar);

    return botao;
}

// 4.10.5 Carregar as categorias nos campos de seleção e na tela de categorias
function atualizarCategorias() {
    const categoriaAtual = campoCategoria.value;
    const filtroAtual = filtroHistoricoCategoria.value;

    // Campo de categoria do cadastro de despesa
    campoCategoria.innerHTML = "";

    let opcaoInicial = document.createElement("option");
    opcaoInicial.value = "";
    opcaoInicial.textContent = "Selecione uma categoria";
    campoCategoria.appendChild(opcaoInicial);

    categorias.forEach(function(categoria) {
        let opcao = document.createElement("option");
        opcao.value = categoria;
        opcao.textContent = categoria;
        campoCategoria.appendChild(opcao);
    });

    campoCategoria.value = categorias.includes(categoriaAtual) ? categoriaAtual : "";

    // Filtro do histórico
    filtroHistoricoCategoria.innerHTML = "";

    let opcaoTodas = document.createElement("option");
    opcaoTodas.value = "";
    opcaoTodas.textContent = "Todas as categorias";
    filtroHistoricoCategoria.appendChild(opcaoTodas);

    categorias.forEach(function(categoria) {
        let opcao = document.createElement("option");
        opcao.value = categoria;
        opcao.textContent = categoria;
        filtroHistoricoCategoria.appendChild(opcao);
    });

    filtroHistoricoCategoria.value = categorias.includes(filtroAtual) ? filtroAtual : "";

    mostrarListaCategorias();

    // O orçamento mensal do Início depende das categorias
    atualizarPainel();
}

// 4.10.6 Mostrar a lista de categorias (orçamento, editar e excluir)
function mostrarListaCategorias() {
    listaCategorias.innerHTML = "";

    if (categorias.length === 0) {
        let itemVazio = document.createElement("li");
        itemVazio.className = "vazio";
        itemVazio.textContent = "Nenhuma categoria criada ainda.";
        listaCategorias.appendChild(itemVazio);
        return;
    }

    categorias.forEach(function(nomeCategoria) {
        let item = document.createElement("li");

        // Uma despesa recorrente conta uma vez só (e não uma por mês gerado)
        let cadastradas = new Set();

        gastos.forEach(function(despesa) {
            if (despesa.categoria === nomeCategoria) {
                cadastradas.add(
                    despesa.recorrente ? `rec-${despesa.idRecorrencia || despesa.id}` : `avulsa-${despesa.id}`
                );
            }
        });

        let quantidade = cadastradas.size;

        let info = document.createElement("div");
        info.className = "linha-info";

        let titulo = document.createElement("strong");
        titulo.className = "linha-titulo";
        titulo.textContent = nomeCategoria;

        let meta = document.createElement("span");
        meta.className = "linha-meta";
        meta.textContent = quantidade === 1
            ? "1 despesa"
            : `${quantidade} despesas`;

        if (Number(orcamentos[nomeCategoria]) > 0) {
            meta.textContent += ` · orçamento ${formatarMoeda(orcamentos[nomeCategoria])}/mês`;
        }

        info.appendChild(titulo);
        info.appendChild(meta);

        let acoes = document.createElement("div");
        acoes.className = "linha-acoes";

        acoes.appendChild(
            criarBotaoIcone("orcamento", "Definir orçamento mensal", function() {
                definirOrcamento(nomeCategoria);
            })
        );

        acoes.appendChild(
            criarBotaoIcone("editar", "Editar categoria", function() {
                editarCategoria(nomeCategoria);
            })
        );

        acoes.appendChild(
            criarBotaoIcone("excluir", "Excluir categoria", function() {
                excluirCategoria(nomeCategoria);
            })
        );

        item.appendChild(info);
        item.appendChild(acoes);
        listaCategorias.appendChild(item);
    });
}

// 4.10.7 Criar uma nova categoria (com orçamento opcional)
formCategoria.addEventListener("submit", function(event) {
    event.preventDefault();

    let nomeCategoria = campoNovaCategoria.value.trim();
    let orcamento = Number(campoOrcamentoCategoria.value);

    if (nomeCategoria === "") {
        mostrarAviso("Digite um nome para a categoria.");
        return;
    }

    let categoriaExistente = categorias.some(function(categoria) {
        return categoria.toLowerCase() === nomeCategoria.toLowerCase();
    });

    if (categoriaExistente) {
        mostrarAviso("Essa categoria já existe.");
        return;
    }

    categorias.push(nomeCategoria);

    if (Number.isFinite(orcamento) && orcamento > 0) {
        orcamentos[nomeCategoria] = orcamento;
        salvarOrcamentos();
    }

    localStorage.setItem("categorias", JSON.stringify(categorias));

    atualizarCategorias();
    formCategoria.reset();
});

// 4.10.8 Definir (ou remover) o orçamento mensal de uma categoria
async function definirOrcamento(nomeCategoria) {
    let atual = Number(orcamentos[nomeCategoria]) > 0
        ? orcamentos[nomeCategoria]
        : "";

    let resposta = await perguntar({
        icone: "meta",
        titulo: "Orçamento mensal",
        mensagem: `Quanto você quer gastar por mês em "${nomeCategoria}"? Deixe vazio para remover o limite.`,
        rotulo: "Valor (R$)",
        placeholder: "Ex.: 600",
        valor: atual
    });

    if (resposta === null) {
        return;
    }

    resposta = resposta.trim().replace(",", ".");

    if (resposta === "") {
        delete orcamentos[nomeCategoria];
    } else {
        let valor = Number(resposta);

        if (!Number.isFinite(valor) || valor <= 0) {
            mostrarAviso("Informe um valor maior que zero.");
            return;
        }

        orcamentos[nomeCategoria] = valor;
    }

    salvarOrcamentos();
    mostrarListaCategorias();
    atualizarPainel();
}

// 4.10.9 Editar uma categoria
async function editarCategoria(categoriaSelecionada) {
    let novoNome = await perguntar({
        titulo: "Editar categoria",
        mensagem: "Digite o novo nome da categoria.",
        rotulo: "Nome",
        tipo: "text",
        valor: categoriaSelecionada
    });

    if (novoNome === null) {
        return;
    }

    novoNome = novoNome.trim();

    if (novoNome === "") {
        mostrarAviso("O nome da categoria não pode ficar vazio.");
        return;
    }

    let nomeExistente = categorias.some(function(categoria) {
        return categoria.toLowerCase() === novoNome.toLowerCase()
            && categoria !== categoriaSelecionada;
    });

    if (nomeExistente) {
        mostrarAviso("Já existe uma categoria com esse nome.");
        return;
    }

    let indice = categorias.indexOf(categoriaSelecionada);

    if (indice === -1) {
        mostrarAviso("Categoria não encontrada.");
        return;
    }

    let estavaSelecionada = campoCategoria.value === categoriaSelecionada;

    categorias[indice] = novoNome;

    // O orçamento acompanha o novo nome
    if (orcamentos[categoriaSelecionada] !== undefined) {
        orcamentos[novoNome] = orcamentos[categoriaSelecionada];
        delete orcamentos[categoriaSelecionada];
        salvarOrcamentos();
    }

    // Atualizar as despesas que utilizam a categoria
    gastos.forEach(function(despesa) {
        if (despesa.categoria === categoriaSelecionada) {
            despesa.categoria = novoNome;
        }
    });

    localStorage.setItem("categorias", JSON.stringify(categorias));
    localStorage.setItem("gastos", JSON.stringify(gastos));

    atualizarCategorias();

    if (estavaSelecionada) {
        campoCategoria.value = novoNome;
    }

    atualizarHistorico();
    atualizarResumoMensal();
}

// 4.10.10 Excluir uma categoria
async function excluirCategoria(categoriaSelecionada) {
    let categoriaEmUso = gastos.some(function(despesa) {
        return despesa.categoria === categoriaSelecionada;
    });

    if (categoriaEmUso) {
        mostrarAviso(
            "Essa categoria está sendo usada em despesas. " +
            "Edite ou exclua essas despesas antes de excluir a categoria."
        );
        return;
    }

    if (!await confirmar({
        titulo: "Excluir categoria",
        mensagem: `Deseja excluir a categoria "${categoriaSelecionada}"?`,
        textoConfirmar: "Excluir",
        perigo: true
    })) {
        return;
    }

    categorias = categorias.filter(function(categoria) {
        return categoria !== categoriaSelecionada;
    });

    delete orcamentos[categoriaSelecionada];

    localStorage.setItem("categorias", JSON.stringify(categorias));
    salvarOrcamentos();

    atualizarCategorias();
}

// 4.11 Funções de formatação
function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Transforma "2026-10-27" em "27/10/2026"
function formatarDataBR(data) {
    if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return data || "";
    }

    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Transforma "2026-10" em "outubro de 2026"
function nomeDoMes(mesAno) {
    const partes = mesAno.split("-");

    const nome = new Date(Number(partes[0]), Number(partes[1]) - 1, 1)
        .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    // Primeira letra maiúscula: "Outubro de 2026"
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}

// 4.11.1 Mensagem curta de confirmação no cadastro de despesas
let temporizadorMensagem = null;

function mostrarMensagemDespesa(texto) {
    mensagemDespesa.textContent = texto;

    clearTimeout(temporizadorMensagem);

    temporizadorMensagem = setTimeout(function() {
        mensagemDespesa.textContent = "";
    }, 3000);
}

// 4.11.2 Criar uma linha de despesa (com ou sem botões de ação)
function criarLinhaDespesa(despesa, comAcoes) {
    let item = document.createElement("li");

    // Descrição, data e categoria
    let info = document.createElement("div");
    info.className = "linha-info";

    let titulo = document.createElement("strong");
    titulo.className = "linha-titulo";
    titulo.textContent = tituloDaDespesa(despesa);

    let meta = document.createElement("span");
    meta.className = "linha-meta";
    meta.textContent =
        `${formatarDataBR(despesa.data)} · ${despesa.categoria || "Sem categoria"}`;

    const linhaTitulo = document.createElement("div");
    linhaTitulo.className = "linha-titulo-selo";
    linhaTitulo.appendChild(titulo);

    if (despesa.parcela) {
        const seloCartao = document.createElement("span");
        seloCartao.className = "selo-cartao";
        seloCartao.textContent = `Cartão ${despesa.parcela.numero}/${despesa.parcela.total}`;
        linhaTitulo.appendChild(seloCartao);
    }

    info.appendChild(linhaTitulo);
    info.appendChild(meta);

    // Valor e status de pagamento
    let direita = document.createElement("div");
    direita.className = "linha-direita";

    let valor = document.createElement("span");
    valor.className = "linha-valor";
    valor.textContent = formatarMoeda(despesa.valor);

    direita.appendChild(valor);

    // O status de pagamento existe nas despesas recorrentes e nas parcelas do cartão
    if ((despesa.recorrente || despesa.parcela) && despesaAtiva(despesa)) {
        let selo;

        if (comAcoes) {
            selo = document.createElement("button");
            selo.type = "button";
            selo.title = "Alternar entre paga e pendente";

            selo.addEventListener("click", function() {
                despesa.paga = !despesa.paga;

                if (despesa.paga) {
                    despesa.dataPagamento = dataDeHoje();
                    despesa.pagoEm = Date.now();
                } else {
                    delete despesa.dataPagamento;
                    delete despesa.pagoEm;
                }

                localStorage.setItem("gastos", JSON.stringify(gastos));

                atualizarHistorico();
                atualizarResumoMensal();
                atualizarSaldo();
            });
        } else {
            selo = document.createElement("span");
        }

        selo.classList.add("selo");
        selo.classList.add(despesa.paga ? "selo-paga" : "selo-pendente");
        selo.textContent = despesa.paga ? "Paga" : "Pendente";

        direita.appendChild(selo);
    }

    if (!despesaAtiva(despesa)) {
        const seloPausa = document.createElement("span");

        seloPausa.classList.add("selo");
        seloPausa.classList.add(despesa.pausada ? "selo-pausada" : "selo-pulada");
        seloPausa.textContent = despesa.pausada ? "Pausada" : "Pulada";

        direita.appendChild(seloPausa);
        item.classList.add("linha-pausada");
    }

    item.appendChild(info);
    item.appendChild(direita);

    if (comAcoes) {
        let acoes = document.createElement("div");
        acoes.className = "linha-acoes";

        // Só as despesas recorrentes pendentes podem ser pausadas (e as pausadas, retomadas)
        if (despesa.recorrente && !despesa.pulada && (despesa.pausada || !despesa.paga)) {
            const serieParada = Boolean(despesa.pausada);
            const botaoPausa = criarBotaoIcone(
                serieParada ? "retomar" : "pausar",
                serieParada ? "Retomar despesa recorrente" : "Pausar despesa recorrente",
                function() {
                    alternarPausaRecorrencia(despesa);
                }
            );

            botaoPausa.classList.add("botao-pausa", serieParada ? "botao-retomar" : "botao-pausar-ativo");
            acoes.appendChild(botaoPausa);
        }

        acoes.appendChild(
            criarBotaoIcone("editar", "Editar despesa", function() {
                editarGasto(despesa);
            })
        );

        acoes.appendChild(
            criarBotaoIcone("excluir", "Excluir despesa", function() {
                excluirGasto(gastos.indexOf(despesa));
            })
        );

        item.appendChild(acoes);
    }

    return item;
}

// 4.11.3 Mostrar as despesas na tela "Despesas"
function mostrarGastos(lista) {
    listaGastos.innerHTML = "";

    if (lista.length === 0) {
        let itemVazio = document.createElement("li");
        itemVazio.className = "vazio";
        itemVazio.textContent = "Nenhuma despesa neste período.";
        listaGastos.appendChild(itemVazio);
        return;
    }

    // Ordenar pela data (as mais próximas do início do mês primeiro)
    let ordenada = lista.slice().sort(function(a, b) {
        return String(a.data).localeCompare(String(b.data));
    });

    ordenada.forEach(function(despesa) {
        listaGastos.appendChild(criarLinhaDespesa(despesa, true));
    });
}

// 4.11.4 Mostrar o histórico agrupado por mês (somente leitura)
function mostrarHistoricoCompleto() {
    listaHistorico.innerHTML = "";

    let categoriaFiltro = filtroHistoricoCategoria.value;

    // O histórico mostra do passado até o mês atual
    // (as próximas ocorrências recorrentes aparecem na tela "Despesas")
    let registradas = gastos.filter(function(despesa) {
        return typeof despesa.data === "string" &&
            despesa.data.slice(0, 7) <= mesAtual &&
            (!categoriaFiltro || despesa.categoria === categoriaFiltro);
    });

    if (registradas.length === 0) {
        let vazio = document.createElement("p");
        vazio.className = "vazio";
        vazio.textContent = "Nenhuma despesa registrada.";
        listaHistorico.appendChild(vazio);
        return;
    }

    let grupos = {};

    registradas.forEach(function(despesa) {
        let chave = despesa.data.slice(0, 7);

        if (!grupos[chave]) {
            grupos[chave] = [];
        }

        grupos[chave].push(despesa);
    });

    // Meses mais recentes primeiro
    Object.keys(grupos).sort().reverse().forEach(function(chave) {
        let grupo = document.createElement("div");
        grupo.className = "grupo-mes";

        let totalMes = 0;

        grupos[chave].forEach(function(despesa) {
            const valor = Number(despesa.valor);

            if (Number.isFinite(valor) && despesaAtiva(despesa)) {
                totalMes += valor;
            }
        });

        let topo = document.createElement("div");
        topo.className = "grupo-mes-topo";

        let nome = document.createElement("span");
        nome.className = "grupo-mes-nome";
        nome.textContent = nomeDoMes(chave);

        let total = document.createElement("span");
        total.className = "grupo-mes-total";
        total.textContent = formatarMoeda(totalMes);

        topo.appendChild(nome);
        topo.appendChild(total);
        grupo.appendChild(topo);

        let lista = document.createElement("ul");
        lista.className = "lista-despesas";

        grupos[chave]
            .sort(function(a, b) {
                return b.data.localeCompare(a.data);
            })
            .forEach(function(despesa) {
                lista.appendChild(criarLinhaDespesa(despesa, false));
            });

        grupo.appendChild(lista);
        listaHistorico.appendChild(grupo);
    });
}

// 4.11.5 Contar as contas recorrentes que ainda não foram pagas
function atualizarContasPendentes(lista) {
    let pendentes = lista.filter(function(despesa) {
        return (despesa.recorrente || despesa.parcela) && !despesa.paga && despesaAtiva(despesa);
    }).length;

    contasPendentes.textContent = pendentes;
}

// 4.12 Atualizar o histórico conforme o mês selecionado
function atualizarHistorico() {
    let mesSelecionado = filtroMes.value;
    let gastosFiltrados;

    if (mesSelecionado === "") {
        gastosFiltrados = gastos;
    } else {
        gastosFiltrados = gastos.filter(function(despesa) {
            return typeof despesa.data === "string" &&
                despesa.data.startsWith(mesSelecionado);
        });
    }

    mostrarGastos(gastosFiltrados);

    let totalPeriodo = 0;

    gastosFiltrados.forEach(function(despesa) {
        const valor = Number(despesa.valor);

        if (Number.isFinite(valor) && despesaAtiva(despesa)) {
            totalPeriodo += valor;
        }
    });

    totalDespesasPeriodo.textContent = formatarMoeda(totalPeriodo);

    // Atualizar o restante da seção "Minhas despesas"
    filtroMesDespesas.value = mesSelecionado;
    filtroMesRelatorios.value = mesSelecionado;

    periodoDespesas.textContent = mesSelecionado
        ? nomeDoMes(mesSelecionado)
        : "Todos os períodos";

    contagemDespesas.textContent = gastosFiltrados.length === 1
        ? "1 despesa"
        : `${gastosFiltrados.length} despesas`;

    atualizarContasPendentes(gastosFiltrados);
    mostrarListaCategorias();
    mostrarHistoricoCompleto();
}

// 4.12.1 Calcular a próxima data de vencimento
function calcularProximoVencimento(data, frequencia, dia) {
    let proximaData = new Date(`${data}T12:00:00`);

    if (frequencia === "mensal") {
        proximaData.setDate(1);
        proximaData.setMonth(proximaData.getMonth() + 1);

        let ultimoDia = new Date(
            proximaData.getFullYear(),
            proximaData.getMonth() + 1,
            0
        ).getDate();

        let diaVencimento = dia || proximaData.getDate();

        proximaData.setDate(Math.min(diaVencimento, ultimoDia));
    }

    if (frequencia === "semanal") {
        proximaData.setDate(proximaData.getDate() + 7);
    }

    if (frequencia === "anual") {
        proximaData.setFullYear(proximaData.getFullYear() + 1);
    }

    return proximaData.toISOString().slice(0, 10);
}

// 4.12.2 Verificar se a ocorrência já existe
function ocorrenciaJaExiste(idRecorrencia, data) {
    let jaExiste = gastos.some(function(despesa) {
        return despesa.idRecorrencia === idRecorrencia &&
            despesa.data === data;
    });

    let foiExcluida = ocorrenciasExcluidas.some(function(ocorrencia) {
        return ocorrencia.idRecorrencia === idRecorrencia &&
            ocorrencia.data === data;
    });

    return jaExiste || foiExcluida;
}

// 4.12.3 Criar a próxima ocorrência

function criarProximaOcorrencia(despesa) {
    if (!despesa.modeloRecorrencia) {
        return;
    }

    let dataBase = despesa.data;
    let idRecorrencia = despesa.idRecorrencia || despesa.id;

    // Gerar as próximas 12 ocorrências
    for (let i = 0; i < 12; i++) {
        let proximaData = calcularProximoVencimento(
            dataBase,
            despesa.frequencia,
            despesa.diaVencimento
        );

        if (!ocorrenciaJaExiste(idRecorrencia, proximaData)) {
            let novaOcorrencia = {
                id: `${idRecorrencia}-${proximaData}`,
                idRecorrencia: idRecorrencia,
                modeloRecorrencia: false,
                descricao: despesa.descricao,
                valor: despesa.valor,
                data: proximaData,
                categoria: despesa.categoria,
                paga: false,
                recorrente: true,
                frequencia: despesa.frequencia,
                diaVencimento: despesa.diaVencimento
            };

            gastos.push(novaOcorrencia);
        }

        dataBase = proximaData;
    }

    localStorage.setItem("gastos", JSON.stringify(gastos));
}

// 4.13 Somar as despesas de um mês específico
function somarDespesasDoMes(mes) {
    let total = 0;

    gastos.forEach(function(despesa) {
        if (
            despesaAtiva(despesa) &&
            typeof despesa.data === "string" &&
            despesa.data.startsWith(mes)
        ) {
            const valor = Number(despesa.valor);

            if (Number.isFinite(valor)) {
                total += valor;
            }
        }
    });

    return total;
}

// 4.14 Detectar mudança no mês selecionado
filtroMes.addEventListener("change", function() {
    atualizarHistorico();
    atualizarResumoMensal();
    atualizarSaldo();
});

// 5. Elementos do resumo mensal e do saldo
const saldoRestante = document.getElementById("saldo-restante");

// *Preparar os gráficos do resumo mensal*
let graficoResumoMensal = null;
let graficoDespesasCategoria = null;

// 5.1 Atualizar o resumo do mês selecionado
function atualizarResumoMensal() {
    let mesSelecionado = filtroMes.value;

    if (mesSelecionado === "") {
        totalReceita.textContent = "Selecione um mês";
        totalDespesa.textContent = "Selecione um mês";
        return;
    }

    let receitaDoMes = buscarReceitaDoMes(mesSelecionado);
    let despesasDoMes = somarDespesasDoMes(mesSelecionado);

    // 1. Grafico
    atualizarGraficos(mesSelecionado, receitaDoMes, despesasDoMes);

    totalReceita.textContent = receitaDoMes.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    totalDespesa.textContent = despesasDoMes.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// 1.1 Gráficos modernos (Chart.js)

// Cores dos gráficos (combinam com a paleta do aplicativo)
const COR_RECEITA = "#34D399";
const COR_DESPESA = "#FB7185";
const COR_SALDO = "#8B7CF6";

const PALETA_GRAFICOS = [
    "#8B7CF6", // roxo
    "#F0B93B", // dourado
    "#2DD4BF", // turquesa
    "#FB7185", // rosa
    "#60A5FA", // azul
    "#F472B6", // magenta
    "#A3E635", // lima
    "#FB923C"  // laranja
];

if (typeof Chart !== "undefined") {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
}

// 1.1.1 Ler as cores do tema atual (escuro ou claro)
function coresDoTema() {
    const estilo = getComputedStyle(document.body);

    return {
        texto: estilo.getPropertyValue("--texto").trim(),
        textoSecundario: estilo.getPropertyValue("--texto-2").trim(),
        borda: estilo.getPropertyValue("--borda").trim(),
        cartao: estilo.getPropertyValue("--cartao").trim()
    };
}

// 1.1.2 Transformar uma cor "#RRGGBB" em "rgba(...)"
function comTransparencia(cor, alfa) {
    const r = parseInt(cor.slice(1, 3), 16);
    const g = parseInt(cor.slice(3, 5), 16);
    const b = parseInt(cor.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

// 1.1.3 Degradê vertical das barras (cor forte em cima, suave embaixo)
function gradienteBarra(contexto, cor) {
    const area = contexto.chart.chartArea;

    if (!area) {
        return cor;
    }

    const degrade = contexto.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    degrade.addColorStop(0, cor);
    degrade.addColorStop(1, comTransparencia(cor, 0.25));

    return degrade;
}

// 1.1.4 Valores curtos no eixo: 1.500 -> "1,5 mil"
function abreviarValor(valor) {
    if (Math.abs(valor) >= 1000) {
        return (valor / 1000).toLocaleString("pt-BR", {
            maximumFractionDigits: 1
        }) + " mil";
    }

    return valor.toLocaleString("pt-BR");
}

// 1.1.5 Aparência da caixinha que aparece ao tocar no gráfico
function estiloTooltip(cores, habilitado, rotulo) {
    return {
        enabled: habilitado,
        backgroundColor: cores.cartao,
        titleColor: cores.texto,
        bodyColor: cores.textoSecundario,
        borderColor: cores.borda,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
            label: rotulo
        }
    };
}

// 1.1.6 Opções do gráfico de barras
function opcoesGraficoBarras(cores) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 8 } },
        animation: { duration: 700, easing: "easeOutQuart" },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: cores.textoSecundario }
            },
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: cores.borda },
                ticks: {
                    color: cores.textoSecundario,
                    maxTicksLimit: 5,
                    callback: function(valor) {
                        return "R$ " + abreviarValor(valor);
                    }
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: estiloTooltip(cores, true, function(item) {
                return formatarMoeda(item.parsed.y);
            })
        }
    };
}

// 1.1.7 Opções do gráfico de rosca
function opcoesGraficoRosca(cores, temDados) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        layout: { padding: 4 },
        animation: { duration: 700, easing: "easeOutQuart" },
        plugins: {
            legend: {
                display: temDados,
                position: "bottom",
                labels: {
                    color: cores.textoSecundario,
                    usePointStyle: true,
                    pointStyle: "circle",
                    boxWidth: 8,
                    boxHeight: 8,
                    padding: 14
                }
            },
            tooltip: estiloTooltip(cores, temDados, function(item) {
                return ` ${item.label}: ${formatarMoeda(item.parsed)}`;
            })
        }
    };
}

// 1.1.8 Texto no centro da rosca (total das despesas)
const pluginTextoCentral = {
    id: "textoCentral",

    afterDraw: function(grafico) {
        const centro = grafico.$centro;

        if (!centro) {
            return;
        }

        const area = grafico.chartArea;
        const x = (area.left + area.right) / 2;
        const y = (area.top + area.bottom) / 2;
        const contexto = grafico.ctx;

        contexto.save();
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";

        contexto.fillStyle = centro.corSecundaria;
        contexto.font = "500 12px Inter, sans-serif";
        contexto.fillText("Total", x, y - 12);

        contexto.fillStyle = centro.cor;
        contexto.font = "700 18px Inter, sans-serif";
        contexto.fillText(centro.valor, x, y + 8);

        contexto.restore();
    }
};

function definirTextoCentral(grafico, valor, cores) {
    grafico.$centro = {
        valor: valor,
        cor: cores.texto,
        corSecundaria: cores.textoSecundario
    };
}

// 1.1.9 Atualizar (ou criar) os dois gráficos do resumo mensal
function atualizarGraficos(mesSelecionado, receita, despesas) {
    const areaResumo = document.getElementById("grafico-resumo-mensal");
    const areaCategorias = document.getElementById("grafico-despesas-categoria");

    if (!areaResumo || !areaCategorias || typeof Chart === "undefined") {
        return;
    }

    const cores = coresDoTema();

    // Calcular o saldo do mês
    const saldo = receita - despesas;
    const coresBarras = [COR_RECEITA, COR_DESPESA, COR_SALDO];

    // Dados do gráfico de barras
    const dadosResumo = {
        labels: ["Receitas", "Despesas", "Saldo"],
        datasets: [{
            data: [receita, despesas, Math.max(0, saldo)],
            backgroundColor: function(contexto) {
                return gradienteBarra(contexto, coresBarras[contexto.dataIndex]);
            },
            borderRadius: 10,
            borderSkipped: false,
            maxBarThickness: 56
        }]
    };

    if (graficoResumoMensal) {
        graficoResumoMensal.data = dadosResumo;
        graficoResumoMensal.options = opcoesGraficoBarras(cores);
        graficoResumoMensal.update();
    } else {
        graficoResumoMensal = new Chart(areaResumo, {
            type: "bar",
            data: dadosResumo,
            options: opcoesGraficoBarras(cores)
        });
    }

    // Separar as despesas por categoria do mês selecionado
    const despesasFiltradas = gastos.filter(function(despesa) {
        return despesaAtiva(despesa) &&
            typeof despesa.data === "string" &&
            despesa.data.startsWith(mesSelecionado);
    });

    const totaisCategorias = {};

    despesasFiltradas.forEach(function(despesa) {
        const categoria = despesa.categoria || "Sem categoria";
        const valor = Number(despesa.valor);

        if (Number.isFinite(valor) && valor > 0) {
            totaisCategorias[categoria] =
                (totaisCategorias[categoria] || 0) + valor;
        }
    });

    // Maiores categorias primeiro
    const categoriasOrdenadas = Object.keys(totaisCategorias).sort(function(a, b) {
        return totaisCategorias[b] - totaisCategorias[a];
    });

    const temDados = categoriasOrdenadas.length > 0;

    // Sem despesas: mostrar um anel vazio em cinza
    const dadosCategorias = {
        labels: temDados ? categoriasOrdenadas : ["Sem despesas"],
        datasets: [{
            data: temDados
                ? categoriasOrdenadas.map(function(nome) { return totaisCategorias[nome]; })
                : [1],
            backgroundColor: temDados
                ? categoriasOrdenadas.map(function(nome, indice) {
                    return PALETA_GRAFICOS[indice % PALETA_GRAFICOS.length];
                })
                : [cores.borda],
            borderWidth: 0,
            borderRadius: temDados ? 8 : 0,
            spacing: temDados ? 4 : 0,
            hoverOffset: temDados ? 6 : 0
        }]
    };

    if (graficoDespesasCategoria) {
        graficoDespesasCategoria.data = dadosCategorias;
        graficoDespesasCategoria.options = opcoesGraficoRosca(cores, temDados);
    } else {
        graficoDespesasCategoria = new Chart(areaCategorias, {
            type: "doughnut",
            data: dadosCategorias,
            options: opcoesGraficoRosca(cores, temDados),
            plugins: [pluginTextoCentral]
        });
    }

    graficoDespesasCategoria.$temDados = temDados;
    definirTextoCentral(graficoDespesasCategoria, formatarMoeda(despesas), cores);
    graficoDespesasCategoria.update();
}

// 1.1.10 Atualizar as cores dos gráficos ao trocar o tema
function aplicarTemaNosGraficos() {
    const cores = coresDoTema();

    if (graficoResumoMensal) {
        graficoResumoMensal.options = opcoesGraficoBarras(cores);
        graficoResumoMensal.update();
    }

    if (graficoDespesasCategoria) {
        const temDados = graficoDespesasCategoria.$temDados;

        graficoDespesasCategoria.options = opcoesGraficoRosca(cores, temDados);

        if (!temDados) {
            graficoDespesasCategoria.data.datasets[0].backgroundColor = [cores.borda];
        }

        definirTextoCentral(
            graficoDespesasCategoria,
            graficoDespesasCategoria.$centro.valor,
            cores
        );

        graficoDespesasCategoria.update();
    }

    if (graficoComparativo) {
        atualizarComparativo();
    }
}

// 5.2 Atualizar saldo disponível
function atualizarSaldo() {
    const mes = filtroMes.value;

    if (!mes) {
        saldoRestante.textContent = "Selecione um mês";
        atualizarResumoReserva();
        atualizarPainel();
        return;
    }

    const receita = buscarReceitaDoMes(mes);
    const despesas = somarDespesasDoMes(mes);
    const aportesMetas = somarAportesMetasDoMes(mes);
    const aportesInvestimentosMes = somarAportesInvestimentosDoMes(mes);

    const saldo = receita - despesas - aportesMetas - aportesInvestimentosMes;

    saldoRestante.textContent = saldo.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    saldoRestante.classList.toggle("valor-negativo", saldo < 0);

    atualizarResumoReserva();
    atualizarPainel();
}

// 5.3 Buscar a receita de um mês
function buscarReceitaDoMes(mes) {
    let receitaEncontrada = receitas.find(function(receita) {
        return receita.mes === mes;
    });

    if (receitaEncontrada) {
        const valor = Number(receitaEncontrada.valor);
        return Number.isFinite(valor) ? valor : 0;
    }

    return 0;
}

// 5.4 Preparar o formulário de receita para o mês escolhido
function carregarReceitaDoMes() {
    campoReceita.value = "";
    campoDescricaoReceita.value = "";

    atualizarModoModalReceita();
}

campoMesReceita.addEventListener("change", function() {
    carregarReceitaDoMes();
});

// 6. Elementos do planejamento de metas e dos aportes
const formPlanejamento = document.getElementById("form-planejamento");
const campoNomeMeta = document.getElementById("nome-meta");
const campoValorMeta = document.getElementById("valor-meta");
const campoDataInicioMeta = document.getElementById("data-inicio-meta");
const campoPrazoMeta = document.getElementById("prazo-meta");
const listaMetas = document.getElementById("lista-metas");
const formAporte = document.getElementById("form-aporte");
const metaAporte = document.getElementById("meta-aporte");
const valorAporte = document.getElementById("valor-aporte");
const dataAporte = document.getElementById("data-aporte");

// 6.1 Lista que guardará as metas registradas
let metas = JSON.parse(localStorage.getItem("metas")) || [];

// Garantir que cada meta tenha uma lista válida de aportes
metas.forEach(function(meta) {
    if (!Array.isArray(meta.aportes)) {
        meta.aportes = [];
    }
});

localStorage.setItem("metas", JSON.stringify(metas));

// 6.2 Formulário de planejamento
formPlanejamento.onsubmit = function(event) {
    event.preventDefault();

    // 6.2.1 Pegar os dados digitados
    let nomeMeta = campoNomeMeta.value.trim();
    let valorMeta = campoValorMeta.value;
    let datainiMeta = campoDataInicioMeta.value;
    let prazoMeta = campoPrazoMeta.value;

    // 6.2.2 Guardar o valor da meta como número
    valorMeta = Number(valorMeta);
    if (!nomeMeta || !Number.isFinite(valorMeta) || valorMeta <= 0) {
        mostrarAviso("Informe um nome e um valor válido para a meta, maior que zero.");
        return;
    }

    // 6.2.3 Criar um objeto com os dados da meta
    let novaMeta = {
        nome: nomeMeta,
        valor: valorMeta,
        dataInicial: datainiMeta,
        prazo: prazoMeta,
        aportes: []
    };

    // 6.2.4 Guardar a meta na lista
    metas.push(novaMeta);
    localStorage.setItem("metas", JSON.stringify(metas));
    mostrarMetas(metas);
    atualizarOpcoesMetas();
    atualizarPainel();

    // 6.2.5 Limpar o formulário
    formPlanejamento.reset();
    abrirTela(secaoMetas, "menu");
};

// 6.3 Mostrar metas na página
function mostrarMetas(lista) {
    listaMetas.innerHTML = "";

    if (lista.length === 0) {
        let itemVazio = document.createElement("li");
        itemVazio.className = "vazio";
        itemVazio.textContent = "Nenhuma meta cadastrada.";
        listaMetas.appendChild(itemVazio);
        return;
    }

    lista.forEach(function(meta) {
        let metaItem = document.createElement("li");
        metaItem.className = "item-meta";

        let valorMeta = Number(meta.valor);

        // 6.3.1 Calcular o total aportado na meta
        let totalAportado = calcularTotalAportes(meta);

        // 6.3.2 Calcular a porcentagem de progresso da meta
        let porcentagem;

        if (!Number.isFinite(valorMeta) || valorMeta <= 0) {
            porcentagem = 0;
        } else {
            porcentagem = (totalAportado / valorMeta) * 100;
        }

        if (porcentagem > 100) {
            porcentagem = 100;
        }

        // 6.3.3 Calcular o valor restante após os aportes
        let falta = valorMeta - totalAportado;

        if (!Number.isFinite(falta) || falta < 0) {
            falta = 0;
        }

        // 6.3.4 Topo: nome, datas, valor acumulado e botão de excluir
        let topo = document.createElement("div");
        topo.className = "item-meta-topo";

        let info = document.createElement("div");
        info.className = "linha-info";

        let titulo = document.createElement("strong");
        titulo.className = "linha-titulo";
        titulo.textContent = meta.nome;

        let datas = document.createElement("span");
        datas.className = "linha-meta";
        datas.textContent =
            `Início: ${meta.dataInicial ? formatarDataBR(meta.dataInicial) : "não informado"}` +
            ` · Prazo: ${meta.prazo ? formatarDataBR(meta.prazo) : "não informado"}`;

        info.appendChild(titulo);
        info.appendChild(datas);

        let direita = document.createElement("div");
        direita.className = "linha-direita";

        let acumulado = document.createElement("span");
        acumulado.className = "linha-valor";
        acumulado.textContent = formatarMoeda(totalAportado);

        let deTotal = document.createElement("span");
        deTotal.className = "linha-meta";
        deTotal.textContent = `Meta: ${formatarMoeda(valorMeta)}`;

        direita.appendChild(acumulado);
        direita.appendChild(deTotal);

        let botaoExcluir = criarBotaoIcone("excluir", "Excluir meta", function() {
            excluirMeta(metas.indexOf(meta));
        });

        topo.appendChild(info);
        topo.appendChild(direita);
        topo.appendChild(botaoExcluir);
        metaItem.appendChild(topo);

        // 6.3.5 Barra de progresso
        let barraFundo = document.createElement("div");
        barraFundo.classList.add("barra-progresso");

        let barraPreenchimento = document.createElement("div");
        barraPreenchimento.classList.add("barra-progresso-preenchimento");
        barraPreenchimento.style.width = `${porcentagem}%`;

        barraFundo.appendChild(barraPreenchimento);
        metaItem.appendChild(barraFundo);

        // 6.3.6 Rodapé: porcentagem e quanto falta
        let rodape = document.createElement("div");
        rodape.className = "item-meta-rodape";

        let textoProgresso = document.createElement("span");
        textoProgresso.textContent = `${porcentagem.toLocaleString("pt-BR", {
            maximumFractionDigits: 1
        })}% concluído`;

        let textoFalta = document.createElement("span");
        textoFalta.textContent = `Falta ${formatarMoeda(falta)}`;

        rodape.appendChild(textoProgresso);
        rodape.appendChild(textoFalta);
        metaItem.appendChild(rodape);

        listaMetas.appendChild(metaItem);
    });
}

// 6.4 Atualizar as opções de metas no formulário de aporte
function atualizarOpcoesMetas() {
    metaAporte.innerHTML = "";

    let opcaoInicial = document.createElement("option");
    opcaoInicial.value = "";
    opcaoInicial.textContent = "Selecione uma meta";
    metaAporte.appendChild(opcaoInicial);

    metas.forEach(function(meta, indice) {
        let opcao = document.createElement("option");
        opcao.value = indice;
        opcao.textContent = meta.nome;
        metaAporte.appendChild(opcao);
    });
}

// 8. Registrar aportes nas metas
formAporte.onsubmit = function(event) {
    event.preventDefault();

    // 8.1 Pegar os dados digitados
    let indiceMeta = metaAporte.value;
    let valor = Number(valorAporte.value);
    let data = dataAporte.value;

    // 8.2 Validar os dados do aporte
    if (indiceMeta === "") {
        mostrarAviso("Selecione uma meta para registrar o aporte.");
        return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
        mostrarAviso("O valor do aporte deve ser maior que zero.");
        return;
    }

    const dataTeste = new Date(`${data}T00:00:00`);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
        Number.isNaN(dataTeste.getTime()) ||
        dataTeste.toISOString().slice(0, 10) !== data
    ) {
        mostrarAviso("Informe uma data válida.");
        return;
    }

    // 8.3 Encontrar a meta escolhida
    let metaSelecionada = metas[Number(indiceMeta)];

    // 8.3.1 Impedir que o aporte seja associado a uma meta inexistente
    if (!metaSelecionada) {
        mostrarAviso("A meta selecionada não foi encontrada.");
        return;
    }

    // 8.4 Criar o registro do aporte
    let novoAporte = {
        valor: valor,
        data: data,
        registradoEm: Date.now()
    };

    // 8.5 Guardar o aporte na meta escolhida
    if (!Array.isArray(metaSelecionada.aportes)) {
        metaSelecionada.aportes = [];
    }

    metaSelecionada.aportes.push(novoAporte);
    localStorage.setItem("metas", JSON.stringify(metas));
    filtroMes.value = data.slice(0, 7);
    mostrarMetas(metas);
    atualizarHistorico();
    atualizarResumoMensal();
    atualizarSaldo();

    // 8.6 Limpar o formulário após registrar o aporte
    formAporte.reset();
    abrirTela(secaoMetas, "menu");
};

// 9. Calcular o total de aportes de uma meta
function calcularTotalAportes(meta) {
    let total = 0;

    if (!Array.isArray(meta.aportes)) {
        return total;
    }

    meta.aportes.forEach(function(aporte) {
        const valor = Number(aporte.valor);

        if (Number.isFinite(valor) && valor > 0) {
            total += valor;
        }
    });

    return total;
}

// 10. Excluir metas
async function excluirMeta(indice) {
    if (indice < 0 || indice >= metas.length) {
        return;
    }

    if (!await confirmar({
        titulo: "Excluir meta",
        mensagem: "Tem certeza de que deseja excluir esta meta? Os aportes dela também serão apagados.",
        textoConfirmar: "Excluir",
        perigo: true
    })) {
        return;
    }

    metas.splice(indice, 1);

    localStorage.setItem("metas", JSON.stringify(metas));

    mostrarMetas(metas);
    atualizarOpcoesMetas();

    // Atualizar os resumos financeiros após excluir a meta
    atualizarResumoMensal();
    atualizarSaldo();
}

// 11. Excluir despesas
async function excluirGasto(indice) {
    if (indice < 0 || indice >= gastos.length) {
        return;
    }

    if (!await confirmar({
        titulo: "Excluir despesa",
        mensagem: `Tem certeza de que deseja excluir "${gastos[indice].descricao}"?`,
        textoConfirmar: "Excluir",
        perigo: true
    })) {
        return;
    }

    let despesaExcluida = gastos[indice];

    if (despesaExcluida.idRecorrencia) {
        ocorrenciasExcluidas.push({
            idRecorrencia: despesaExcluida.idRecorrencia,
            data: despesaExcluida.data
        });

        localStorage.setItem(
            "ocorrenciasExcluidas",
            JSON.stringify(ocorrenciasExcluidas)
        );
    }

    gastos.splice(indice, 1);

    localStorage.setItem("gastos", JSON.stringify(gastos));

    atualizarHistorico();
    atualizarResumoMensal();
    atualizarSaldo();
}

// 12. Editar despesas
async function editarGasto(despesa) {
    const opcoesCategoria = categorias.slice();

    if (despesa.categoria && !opcoesCategoria.includes(despesa.categoria)) {
        opcoesCategoria.push(despesa.categoria);
    }

    const resultado = await abrirFormulario({
        icone: "editar",
        titulo: "Editar despesa",
        mensagem: "Altere os dados que quiser e salve.",
        textoConfirmar: "Salvar",
        campos: [
            { id: "descricao", rotulo: "Descrição", tipo: "text", valor: despesa.descricao },
            { id: "valor", rotulo: "Valor (R$)", tipo: "decimal", valor: String(despesa.valor).replace(".", ",") },
            { id: "data", rotulo: "Data", tipo: "date", valor: despesa.data },
            { id: "categoria", rotulo: "Categoria", tipo: "select", valor: despesa.categoria, opcoes: opcoesCategoria }
        ],
        validar: function(valores) {
            const valorDigitado = Number(valores.valor.trim().replace(",", "."));
            const dataTeste = new Date(`${valores.data}T00:00:00`);

            if (valores.descricao.trim() === "" || !Number.isFinite(valorDigitado) || valorDigitado <= 0) {
                return "Informe uma descrição e um valor válido maior que zero.";
            }

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(valores.data) ||
                Number.isNaN(dataTeste.getTime()) ||
                dataTeste.toISOString().slice(0, 10) !== valores.data
            ) {
                return "Informe uma data válida.";
            }

            if (valores.categoria.trim() === "") {
                return "A categoria não pode ficar vazia.";
            }

            return null;
        }
    });

    if (!resultado) {
        return;
    }

    const novaDescricao = resultado.descricao;
    const novoValor = Number(resultado.valor.trim().replace(",", "."));
    const novaData = resultado.data;
    const novaCategoria = resultado.categoria;

    despesa.descricao = novaDescricao.trim();
    despesa.valor = novoValor;
    despesa.data = novaData;
    despesa.categoria = novaCategoria.trim();

    // 12.1 Selecionar o mês da nova data da despesa
    filtroMes.value = novaData.slice(0, 7);

    localStorage.setItem("gastos", JSON.stringify(gastos));

    atualizarHistorico();
    atualizarResumoMensal();
    atualizarSaldo();
}

// 13. Excluir a receita do mês selecionado
async function excluirReceitaDoMes() {
    let mesSelecionado = campoMesReceita.value;

    let indice = receitas.findIndex(function(receita) {
        return receita.mes === mesSelecionado;
    });

    if (indice === -1) {
        mostrarAviso("Não existe receita cadastrada para esse mês.");
        return;
    }

    if (!await confirmar({
        titulo: "Excluir receita",
        mensagem: "Tem certeza de que deseja excluir a receita deste mês?",
        textoConfirmar: "Excluir",
        perigo: true
    })) {
        return;
    }

    receitas.splice(indice, 1);

    localStorage.setItem("receitas", JSON.stringify(receitas));

    campoReceita.value = "";
    campoDescricaoReceita.value = "";

    atualizarResumoMensal();
    atualizarSaldo();
    fecharModalReceita();

    mostrarAviso("Receita excluída com sucesso.");
}

// 14. Reserva de emergência e investimentos
// 14.1 Listas que guardarão os investimentos e seus aportes
let investimentos = JSON.parse(localStorage.getItem("investimentos")) || [];

let aportesInvestimentos = JSON.parse(
    localStorage.getItem("aportesInvestimentos")
) || [];

// 14.2 Elementos do HTML
// Cadastro de investimentos
const formReserva = document.getElementById("form-reserva");
const tipoInvestimento = document.getElementById("tipo-investimento");
const nomeInvestimento = document.getElementById("nome-investimento");
const dataInvestimento = document.getElementById("data-investimento");
const listaInvestimentos = document.getElementById("lista-investimentos");
const metaInvestimento = document.getElementById("meta-investimento");
const reservaMetaBloco = document.getElementById("reserva-meta-bloco");

// Resumo da reserva
const saldoDisponivelReserva = document.getElementById("saldo-disponivel-reserva");
const totalAportadoMes = document.getElementById("total-aportado-mes");
const totalReserva = document.getElementById("total-reserva");
const notaAportadoMes = document.getElementById("nota-aportado-mes");
const notaLucroMes = document.getElementById("nota-lucro-mes");

// Cadastro de novos aportes
const formAporteReserva = document.getElementById("form-aporte-reserva");
const valorAporteReserva = document.getElementById("valor-aporte-reserva");
const investimentoAporteReserva = document.getElementById("investimento-aporte-reserva");
const dataAporteReserva = document.getElementById("data-aporte-reserva");

// 14.3 Funções de cálculo dos aportes

// Somar os aportes de investimentos de um mês
function somarAportesInvestimentosDoMes(mes) {
    return aportesInvestimentos.reduce(function(total, aporte) {
        // Verificar a data antes de somar o aporte
        if (typeof aporte.data === "string" && aporte.data.startsWith(mes)) {
            const valor = Number(aporte.valor);

            if (Number.isFinite(valor) && valor > 0) {
                total += valor;
            }
        }
        return total;
    }, 0);
}

// Calcular o total acumulado da reserva
function calcularTotalReserva() {
    return aportesInvestimentos.reduce(function(total, aporte) {
        const valor = Number(aporte.valor);

        if (Number.isFinite(valor) && valor > 0) {
            return total + valor;
        }

        return total;
    }, 0);
}

// Somar os aportes das metas de um mês
function somarAportesMetasDoMes(mes) {
    let total = 0;

    metas.forEach(function(meta) {
        if (Array.isArray(meta.aportes)) {
            meta.aportes.forEach(function(aporte) {
                if (typeof aporte.data === "string" && aporte.data.startsWith(mes)) {
                    const valor = Number(aporte.valor);

                    if (Number.isFinite(valor) && valor > 0) {
                        total += valor;
                    }
                }
            });
        }
    });

    return total;
}


// ==========================================================
// 24. APIs, rendimento da reserva e cadastro de investimentos
// ==========================================================

// 24.1 Cache das consultas (para funcionar também sem internet)
function lerCacheApi() {
    try {
        return JSON.parse(localStorage.getItem("cacheApi")) || {};
    } catch (erro) {
        return {};
    }
}

let cacheApi = lerCacheApi();

function salvarCacheApi() {
    try {
        localStorage.setItem("cacheApi", JSON.stringify(cacheApi));
    } catch (erro) {
        // Sem armazenamento: apenas não guarda o cache
    }
}

// Consulta JSON com tempo limite
async function buscarJSON(url, limiteMs) {
    const controle = new AbortController();
    const temporizador = setTimeout(function() {
        controle.abort();
    }, limiteMs || 8000);

    try {
        const resposta = await fetch(url, { signal: controle.signal });

        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }

        return await resposta.json();
    } finally {
        clearTimeout(temporizador);
    }
}

// 24.2 Provedores (identificadores usados no cadastro)
const URL_BCB = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.";

const PROVEDORES = {
    acao: {
        recomendado: "brapi_api",
        opcoes: [
            ["brapi_api", "Brapi API [Recomendado para B3]"],
            ["yahoo_finance", "Yahoo Finance API"],
            ["endpoint", "Endpoint REST personalizado"]
        ]
    },
    cripto: {
        recomendado: "coingecko",
        opcoes: [
            ["coingecko", "CoinGecko API [Recomendado para cripto]"],
            ["yahoo_finance", "Yahoo Finance API"],
            ["endpoint", "Endpoint REST personalizado"]
        ]
    },
    internacional: {
        recomendado: "yahoo_finance",
        opcoes: [
            ["yahoo_finance", "Yahoo Finance API [Recomendado para ações globais]"],
            ["endpoint", "Endpoint REST personalizado"]
        ]
    }
};

const NOMES_PROVEDOR = {
    brapi_api: "Brapi",
    coingecko: "CoinGecko",
    yahoo_finance: "Yahoo Finance",
    endpoint: "Endpoint REST"
};

const DICAS_TICKER = {
    brapi_api: "Ex.: PETR4, HGLG11",
    coingecko: "Ex.: bitcoin, ethereum",
    yahoo_finance: "Ex.: AAPL, PETR4.SA, BTC-USD",
    endpoint: "Ex.: https://api.exemplo.com/preco"
};

// 24.3 Taxas de renda fixa (Banco Central)
const TAXA_PADRAO_ANUAL = { selic: 10.75, cdi: 10.65 };

function anualDeDiaria(taxaDiaria) {
    return (Math.pow(1 + taxaDiaria / 100, 252) - 1) * 100;
}

function mensalDeAnual(taxaAnual) {
    return Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
}

function dataParaBCB(data) {
    return `${String(data.getDate()).padStart(2, "0")}/` +
        `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
}

// "01/10/2026" -> "2026-10"
function mesDaDataBCB(texto) {
    const partes = String(texto).split("/");

    return `${partes[2]}-${partes[1]}`;
}

function taxaAnualAtual(serie) {
    const taxas = cacheApi.taxas || {};
    const valor = Number(taxas[`${serie}Anual`]);

    return valor > 0 ? valor : TAXA_PADRAO_ANUAL[serie];
}

function mesMaisAntigoDaReserva() {
    const meses = [];

    investimentos.forEach(function(investimento) {
        if (/^\d{4}-\d{2}$/.test(investimento.dataInicial || "")) {
            meses.push(investimento.dataInicial);
        }
    });

    aportesInvestimentos.forEach(function(aporte) {
        if (typeof aporte.data === "string") {
            meses.push(aporte.data.slice(0, 7));
        }
    });

    meses.sort();

    return meses.length > 0 ? meses[0] : mesAtual;
}

async function atualizarTaxasBCB(forcar) {
    const antigas = cacheApi.taxas || {};

    // Evita consultar de novo em menos de 6 horas
    if (!forcar && antigas.atualizadoEm && Date.now() - antigas.atualizadoEm < 6 * 3600 * 1000) {
        return;
    }

    const inicio = mesMaisAntigoDaReserva();
    const dataInicial = `01/${inicio.slice(5, 7)}/${inicio.slice(0, 4)}`;
    const dataFinal = dataParaBCB(new Date());
    const faixa = `?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`;

    // SGS 11 = Selic diária, 12 = CDI diário, 4390 = Selic do mês, 4391 = CDI do mês
    const resultados = await Promise.allSettled([
        buscarJSON(`${URL_BCB}11/dados/ultimos/1?formato=json`),
        buscarJSON(`${URL_BCB}12/dados/ultimos/1?formato=json`),
        buscarJSON(`${URL_BCB}4390/dados${faixa}`),
        buscarJSON(`${URL_BCB}4391/dados${faixa}`)
    ]);

    const novas = Object.assign({}, antigas);
    let algumaOk = false;

    if (resultados[0].status === "fulfilled" && resultados[0].value.length) {
        novas.selicAnual = anualDeDiaria(Number(resultados[0].value[0].valor));
        algumaOk = true;
    }

    if (resultados[1].status === "fulfilled" && resultados[1].value.length) {
        novas.cdiAnual = anualDeDiaria(Number(resultados[1].value[0].valor));
        algumaOk = true;
    }

    [[2, "selicMensal"], [3, "cdiMensal"]].forEach(function(par) {
        const resultado = resultados[par[0]];

        if (resultado.status === "fulfilled" && Array.isArray(resultado.value)) {
            const mapa = Object.assign({}, novas[par[1]]);

            resultado.value.forEach(function(linha) {
                const valor = Number(linha.valor);

                if (Number.isFinite(valor)) {
                    mapa[mesDaDataBCB(linha.data)] = valor;
                }
            });

            novas[par[1]] = mapa;
            algumaOk = true;
        }
    });

    if (algumaOk) {
        novas.atualizadoEm = Date.now();
        cacheApi.taxas = novas;
        cacheApi.erroTaxas = false;
    } else {
        cacheApi.erroTaxas = true;
    }
}

// 24.4 Cotações de renda variável
function extrairPreco(dados) {
    const chaves = ["regularMarketPrice", "price", "preco", "last", "close", "valor", "bid", "brl"];

    if (typeof dados === "number") {
        return dados;
    }

    if (Array.isArray(dados)) {
        for (const item of dados) {
            const preco = extrairPreco(item);

            if (preco > 0) {
                return preco;
            }
        }

        return null;
    }

    if (dados && typeof dados === "object") {
        for (const chave of chaves) {
            if (Number(dados[chave]) > 0) {
                return Number(dados[chave]);
            }
        }

        for (const valor of Object.values(dados)) {
            const preco = extrairPreco(valor);

            if (preco > 0) {
                return preco;
            }
        }
    }

    return null;
}

async function buscarPrecoAtivo(api) {
    const ticker = String(api.ticker || "").trim();

    if (api.fonte === "brapi_api") {
        const dados = await buscarJSON(`https://brapi.dev/api/quote/${encodeURIComponent(ticker)}`);

        return Number(dados.results[0].regularMarketPrice);
    }

    if (api.fonte === "coingecko") {
        const id = ticker.toLowerCase();
        const dados = await buscarJSON(
            `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=brl`
        );

        return Number(dados[id].brl);
    }

    if (api.fonte === "yahoo_finance") {
        const dados = await buscarJSON(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
        );
        const meta = dados.chart.result[0].meta;
        let preco = Number(meta.regularMarketPrice);

        // Cotação em dólar: converte para real quando a cotação do dólar está disponível
        if (meta.currency === "USD") {
            const dolar = valorEmDolar("BRL");

            if (dolar > 0) {
                preco = preco / dolar;
            }
        }

        return preco;
    }

    if (api.fonte === "endpoint") {
        return extrairPreco(await buscarJSON(ticker));
    }

    return null;
}

function registrarCotacao(investimento, preco) {
    cacheApi.cotacoes = cacheApi.cotacoes || {};

    const anterior = cacheApi.cotacoes[investimento.id] || {};
    let inicioMes = anterior.inicioMes;

    // No primeiro registro de cada mês, guarda o preço de partida do mês
    if (!inicioMes || inicioMes.mes !== mesAtual) {
        inicioMes = { mes: mesAtual, preco: anterior.preco > 0 ? anterior.preco : preco };
    }

    cacheApi.cotacoes[investimento.id] = {
        preco: preco,
        anterior: anterior.preco > 0 ? anterior.preco : null,
        atualizadoEm: Date.now(),
        inicioMes: inicioMes
    };

    // Aportes sem cotação passam a usar o preço de agora como preço de compra
    let mudou = false;

    aportesInvestimentos.forEach(function(aporte) {
        if (aporte.investimentoId === investimento.id && !(Number(aporte.cotacao) > 0)) {
            aporte.cotacao = preco;
            mudou = true;
        }
    });

    if (mudou) {
        localStorage.setItem("aportesInvestimentos", JSON.stringify(aportesInvestimentos));
    }
}

async function atualizarCotacoesAtivos(forcar) {
    const variaveis = investimentos.filter(function(investimento) {
        return investimento.tipo === "Outro" && investimento.api && investimento.api.ticker;
    });

    cacheApi.erroCotacoes = false;

    for (const investimento of variaveis) {
        const atual = (cacheApi.cotacoes || {})[investimento.id];

        if (!forcar && atual && Date.now() - atual.atualizadoEm < 10 * 60 * 1000) {
            continue;
        }

        try {
            const preco = await buscarPrecoAtivo(investimento.api);

            if (preco > 0) {
                registrarCotacao(investimento, preco);
            } else {
                cacheApi.erroCotacoes = true;
            }
        } catch (erro) {
            cacheApi.erroCotacoes = true;
        }
    }
}

// 24.5 Rendimento estimado de cada investimento
function mesesEntre(inicio, fim) {
    const lista = [];
    let ano = Number(inicio.slice(0, 4));
    let mes = Number(inicio.slice(5, 7));

    while (`${ano}-${String(mes).padStart(2, "0")}` <= fim && lista.length < 1200) {
        lista.push(`${ano}-${String(mes).padStart(2, "0")}`);

        mes += 1;

        if (mes > 12) {
            mes = 1;
            ano += 1;
        }
    }

    return lista;
}

function fracaoDoMes() {
    const hoje = new Date();
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

    return hoje.getDate() / diasNoMes;
}

function aportesDoInvestimento(investimento) {
    return aportesInvestimentos.filter(function(aporte) {
        return aporte.investimentoId === investimento.id &&
            typeof aporte.data === "string" &&
            Number(aporte.valor) > 0;
    });
}

// Série (selic ou cdi) e percentual de cada investimento de renda fixa
function configuracaoFixa(investimento) {
    const api = investimento.api || {};
    const serie = api.serie || (investimento.tipo === "CDB com liquidez diária" ? "cdi" : "selic");

    return { serie: serie, fator: (Number(api.percentual) || 100) / 100 };
}

function taxaMensalFixa(serie, mes, fator) {
    const taxas = cacheApi.taxas || {};
    const mensais = taxas[`${serie}Mensal`] || {};
    const publicada = mensais[mes] != null;

    let taxa = publicada
        ? mensais[mes] / 100
        : mensalDeAnual(taxaAnualAtual(serie));

    taxa *= fator;

    // Mês em andamento ainda sem taxa publicada: só rende até hoje
    if (mes === mesAtual && !publicada) {
        taxa *= fracaoDoMes();
    }

    return taxa;
}

// Renda fixa: cada mês rende (saldo anterior + aportes do mês) × taxa do mês
function valorRendaFixa(investimento, ateMes) {
    const aportes = aportesDoInvestimento(investimento);
    const resultado = { saldo: 0, aportado: 0, lucroMes: 0, base: 0, aportesMes: 0 };

    if (aportes.length === 0) {
        return resultado;
    }

    const primeiro = aportes.map(function(aporte) {
        return aporte.data.slice(0, 7);
    }).sort()[0];

    if (primeiro > ateMes) {
        return resultado;
    }

    const configuracao = configuracaoFixa(investimento);
    let saldo = 0;

    mesesEntre(primeiro, ateMes).forEach(function(mes) {
        const anterior = saldo;
        let aportesMes = 0;

        aportes.forEach(function(aporte) {
            if (aporte.data.slice(0, 7) === mes) {
                aportesMes += Number(aporte.valor);
            }
        });

        const taxa = taxaMensalFixa(configuracao.serie, mes, configuracao.fator);

        saldo = (anterior + aportesMes) * (1 + taxa);

        resultado.aportado += aportesMes;
        resultado.aportesMes = aportesMes;
        resultado.base = anterior + aportesMes;
        resultado.lucroMes = saldo - anterior - aportesMes;
    });

    resultado.saldo = saldo;

    return resultado;
}

// Renda variável: quantidade comprada × cotação de hoje (só vale para o mês atual)
function valorRendaVariavel(investimento, ateMes) {
    const aportes = aportesDoInvestimento(investimento).filter(function(aporte) {
        return aporte.data.slice(0, 7) <= ateMes;
    });

    const resultado = { saldo: 0, aportado: 0, lucroMes: 0, base: 0, aportesMes: 0 };

    aportes.forEach(function(aporte) {
        resultado.aportado += Number(aporte.valor);

        if (aporte.data.slice(0, 7) === ateMes) {
            resultado.aportesMes += Number(aporte.valor);
        }
    });

    const cotacao = (cacheApi.cotacoes || {})[investimento.id];

    if (ateMes !== mesAtual || !cotacao || !(cotacao.preco > 0)) {
        // Sem cotação (ou mês passado, sem histórico): considera o valor aportado
        resultado.saldo = resultado.aportado;
        return resultado;
    }

    let quantidade = 0;
    let semCotacao = 0;

    aportes.forEach(function(aporte) {
        if (Number(aporte.cotacao) > 0) {
            quantidade += Number(aporte.valor) / Number(aporte.cotacao);
        } else {
            semCotacao += Number(aporte.valor);
        }
    });

    resultado.saldo = quantidade * cotacao.preco + semCotacao;

    const inicio = cotacao.inicioMes && cotacao.inicioMes.mes === mesAtual ? cotacao.inicioMes.preco : cotacao.preco;

    resultado.lucroMes = quantidade * (cotacao.preco - inicio);
    resultado.base = resultado.saldo - resultado.lucroMes;

    return resultado;
}

function valorDoInvestimento(investimento, ateMes) {
    return investimento.tipo === "Outro"
        ? valorRendaVariavel(investimento, ateMes)
        : valorRendaFixa(investimento, ateMes);
}

// Soma de todos os investimentos até o mês escolhido
function resumoDaReserva(mes) {
    const total = { saldo: 0, aportado: 0, lucroMes: 0, base: 0 };

    investimentos.forEach(function(investimento) {
        const valor = valorDoInvestimento(investimento, mes);

        total.saldo += valor.saldo;
        total.aportado += valor.aportado;
        total.lucroMes += valor.lucroMes;
        total.base += valor.base;
    });

    total.pctMes = total.base > 0 ? (total.lucroMes / total.base) * 100 : 0;

    return total;
}

function calcularReservaAtualizada() {
    return resumoDaReserva(mesAtual).saldo;
}

// 24.6 Seletor de mês e resumo da reserva
const reservaMes = document.getElementById("reserva-mes");

function mesDaReserva() {
    return reservaMes.value || mesAtual;
}

// "2026-10" -> "out/26"
function mesCurto(mesAno) {
    return `${MESES_ABREV[Number(mesAno.slice(5, 7)) - 1].toLowerCase()}/${mesAno.slice(2, 4)}`;
}

// Só do mês atual para trás
function montarSeletorMesReserva() {
    const selecionado = reservaMes.value;
    const maisAntigo = mesMaisAntigoDaReserva();
    let limite = mesAtual;

    for (let i = 0; i < 5; i++) {
        limite = mesAnterior(limite);
    }

    const inicio = maisAntigo < limite ? maisAntigo : limite;
    const meses = mesesEntre(inicio, mesAtual).reverse();
    const assinatura = meses.join(",");

    if (reservaMes.dataset.assinatura === assinatura) {
        return;
    }

    reservaMes.dataset.assinatura = assinatura;
    reservaMes.innerHTML = "";

    meses.forEach(function(mes) {
        const opcao = document.createElement("option");

        opcao.value = mes;
        opcao.textContent = nomeDoMes(mes) + (mes === mesAtual ? " (Atual)" : "");
        reservaMes.appendChild(opcao);
    });

    reservaMes.value = meses.includes(selecionado) ? selecionado : mesAtual;
}

function formatarComSinal(valor) {
    return (valor < 0 ? "-" : "+") + formatarMoeda(Math.abs(valor));
}

function atualizarResumoReserva() {
    montarSeletorMesReserva();

    const mes = mesDaReserva();

    const saldo = buscarReceitaDoMes(mes) -
        somarDespesasDoMes(mes) -
        somarAportesMetasDoMes(mes) -
        somarAportesInvestimentosDoMes(mes);

    saldoDisponivelReserva.textContent = formatarMoeda(saldo);
    saldoDisponivelReserva.classList.toggle("valor-negativo", saldo < 0);

    // Aportado no mês e comparação com o mês anterior
    const aportado = somarAportesInvestimentosDoMes(mes);
    const anterior = mesAnterior(mes);
    const diferenca = aportado - somarAportesInvestimentosDoMes(anterior);

    totalAportadoMes.textContent = formatarMoeda(aportado);
    notaAportadoMes.textContent = `${formatarComSinal(diferenca)} em relação a ${mesCurto(anterior)}`;
    notaAportadoMes.className = "card-resumo-nota sensivel " + (diferenca >= 0 ? "nota-positiva" : "nota-negativa");

    // Total acumulado (com rendimentos) e lucro do mês
    const resumo = resumoDaReserva(mes);
    const pct = resumo.pctMes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    totalReserva.textContent = formatarMoeda(resumo.saldo);
    notaLucroMes.textContent = `Lucro no mês: ${formatarComSinal(resumo.lucroMes)} (${resumo.lucroMes < 0 ? "-" : "+"}${pct.replace("-", "")}%)`;
    notaLucroMes.className = "card-resumo-nota sensivel " + (resumo.lucroMes >= 0 ? "nota-positiva" : "nota-negativa");

    // Barra da meta da reserva (só aparece quando algum investimento tem meta)
    const resumoMeta = resumoMetaReserva(mes);

    reservaMetaBloco.innerHTML = "";
    reservaMetaBloco.hidden = resumoMeta.meta <= 0;

    if (resumoMeta.meta > 0) {
        reservaMetaBloco.appendChild(
            criarBlocoProgresso("Meta da reserva", resumoMeta.acumulado, resumoMeta.meta, "selo-dourado")
        );
    }
}

reservaMes.addEventListener("change", function() {
    atualizarResumoReserva();
    mostrarInvestimentos();
});

// 24.7 Cadastro de investimentos (API fixa ou personalizada)
const apiFixa = document.getElementById("api-fixa");
const apiFixaTitulo = document.getElementById("api-fixa-titulo");
const apiFixaFonte = document.getElementById("api-fixa-fonte");
const apiFixaTaxa = document.getElementById("api-fixa-taxa");
const apiPersonalizada = document.getElementById("api-personalizada");
const apiCategoria = document.getElementById("api-categoria");
const apiProvedor = document.getElementById("api-provedor");
const apiTicker = document.getElementById("api-ticker");
const seloRecomendado = document.getElementById("selo-recomendado");
const valorAporteInicial = document.getElementById("valor-aporte-inicial");

function formatarTaxaAnual(valor) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function montarProvedores() {
    const categoria = PROVEDORES[apiCategoria.value];

    apiProvedor.innerHTML = "";

    categoria.opcoes.forEach(function(opcao) {
        const elemento = document.createElement("option");

        elemento.value = opcao[0];
        elemento.textContent = opcao[1];
        apiProvedor.appendChild(elemento);
    });

    apiProvedor.value = categoria.recomendado;
    seloRecomendado.textContent = `✨ Recomendado: ${NOMES_PROVEDOR[categoria.recomendado]}`;

    atualizarDicaTicker();
}

function atualizarDicaTicker() {
    apiTicker.placeholder = DICAS_TICKER[apiProvedor.value];
}

function atualizarCamposApi() {
    const tipo = tipoInvestimento.value;
    const fixa = tipo !== "Outro";
    const atualizadoEm = (cacheApi.taxas || {}).atualizadoEm;
    const sufixo = atualizadoEm ? "" : " (estimativa, aguardando API)";

    apiFixa.hidden = !fixa;
    apiPersonalizada.hidden = fixa;

    if (tipo === "Tesouro Selic") {
        apiFixaTitulo.textContent = "Sincronização de API predefinida (Selic oficial)";
        apiFixaFonte.textContent = "API Banco Central do Brasil (BCB)";
        apiFixaTaxa.textContent = `100% Selic (~${formatarTaxaAnual(taxaAnualAtual("selic"))}% a.a.)${sufixo}`;
    } else if (tipo === "CDB com liquidez diária") {
        apiFixaTitulo.textContent = "Sincronização de API predefinida (Taxa DI / Selic oficial)";
        apiFixaFonte.textContent = "API Banco Central do Brasil (BCB)";
        apiFixaTaxa.textContent = `100% CDI (~${formatarTaxaAnual(taxaAnualAtual("cdi"))}% a.a.)${sufixo}`;
    }

    if (!fixa && apiProvedor.options.length === 0) {
        montarProvedores();
    }
}

tipoInvestimento.addEventListener("change", atualizarCamposApi);
apiCategoria.addEventListener("change", montarProvedores);
apiProvedor.addEventListener("change", atualizarDicaTicker);

formReserva.addEventListener("submit", function(event) {
    event.preventDefault();

    const tipo = tipoInvestimento.value;
    const data = dataInvestimento.value;
    let nome = nomeInvestimento.value.trim();

    if (!tipo || !data) {
        mostrarAviso("Preencha o tipo e o mês de início do investimento.");
        return;
    }

    let api;

    if (tipo === "Tesouro Selic") {
        api = { fonte: "api_bcb", serie: "selic", percentual: 100 };
    } else if (tipo === "CDB com liquidez diária") {
        api = { fonte: "api_b3_di", serie: "cdi", percentual: 100 };
    } else {
        let ticker = apiTicker.value.trim();
        const provedor = apiProvedor.value;

        if (!ticker) {
            mostrarAviso("Informe o ticker ou o endpoint da API.");
            return;
        }

        if (provedor === "endpoint" && !/^https?:\/\//i.test(ticker)) {
            mostrarAviso("O endpoint precisa começar com http:// ou https://.");
            return;
        }

        if (provedor === "coingecko") {
            ticker = ticker.toLowerCase();
        } else if (provedor !== "endpoint") {
            ticker = ticker.toUpperCase();
        }

        api = { fonte: provedor, categoria: apiCategoria.value, ticker: ticker };

        if (!nome && provedor !== "endpoint") {
            nome = ticker;
        }
    }

    const novoInvestimento = {
        id: Date.now(),
        tipo: tipo,
        nome: nome,
        dataInicial: data,
        api: api
    };

    const metaDigitada = Number(metaInvestimento.value);

    if (metaDigitada > 0) {
        novoInvestimento.meta = metaDigitada;
    }

    investimentos.push(novoInvestimento);
    localStorage.setItem("investimentos", JSON.stringify(investimentos));

    // Aporte inicial (opcional)
    const valorInicial = Number(valorAporteInicial.value);
    const registrouAporte = valorInicial > 0;

    if (registrouAporte) {
        aportesInvestimentos.push({
            investimentoId: novoInvestimento.id,
            valor: valorInicial,
            data: data === mesAtual ? dataDeHoje() : `${data}-01`,
            registradoEm: Date.now(),
            cotacao: null
        });

        localStorage.setItem("aportesInvestimentos", JSON.stringify(aportesInvestimentos));
    }

    mostrarInvestimentos();
    atualizarOpcoesInvestimentos();
    atualizarSaldo();

    formReserva.reset();
    atualizarCamposApi();
    abrirTela(secaoReserva, "menu");

    mostrarAviso(registrouAporte
        ? "Investimento cadastrado com sucesso!"
        : "Investimento cadastrado com sucesso! Agora você pode registrar um aporte.");

    // Busca a cotação do novo ativo
    atualizarTudoApis(true);
});

// 24.8 Lista de investimentos ativos
function descreverFonte(investimento) {
    const api = investimento.api;

    if (investimento.tipo !== "Outro") {
        const configuracao = configuracaoFixa(investimento);

        return configuracao.serie === "cdi"
            ? `API BCB · ${Math.round(configuracao.fator * 100)}% CDI (~${formatarTaxaAnual(taxaAnualAtual("cdi"))}% a.a.)`
            : `API BCB · Selic (~${formatarTaxaAnual(taxaAnualAtual("selic"))}% a.a.)`;
    }

    if (!api || !api.fonte) {
        return "Sem API vinculada";
    }

    const rotulo = api.fonte === "endpoint" ? "Endpoint REST" : `${NOMES_PROVEDOR[api.fonte]} · ${api.ticker}`;
    const cotacao = (cacheApi.cotacoes || {})[investimento.id];

    if (!cotacao || !(cotacao.preco > 0)) {
        return `${rotulo} · sem cotação`;
    }

    let texto = `${rotulo} · ${formatarMoeda(cotacao.preco)}`;

    if (cotacao.anterior > 0) {
        const variacao = (cotacao.preco / cotacao.anterior - 1) * 100;

        texto += ` (${variacao >= 0 ? "+" : ""}${variacao.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%)`;
    }

    return texto;
}

function mostrarInvestimentos() {
    listaInvestimentos.innerHTML = "";

    if (investimentos.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.className = "vazio";
        mensagem.textContent = "Nenhum investimento cadastrado.";
        listaInvestimentos.appendChild(mensagem);
        return;
    }

    const mes = mesDaReserva();

    investimentos.forEach(function(investimento) {
        const valor = valorDoInvestimento(investimento, mes);

        const item = document.createElement("div");
        item.className = "linha-item item-investimento";

        const info = document.createElement("div");
        info.className = "linha-info";

        const titulo = document.createElement("strong");
        titulo.className = "linha-titulo";
        titulo.textContent = investimento.nome || investimento.tipo;

        const detalhes = document.createElement("span");
        detalhes.className = "linha-meta";
        detalhes.textContent = investimento.tipo;

        if (/^\d{4}-\d{2}$/.test(investimento.dataInicial || "")) {
            detalhes.textContent += ` · desde ${nomeDoMes(investimento.dataInicial).toLowerCase()}`;
        }

        const fonte = document.createElement("span");
        fonte.className = "selo-api";
        fonte.textContent = descreverFonte(investimento);

        info.appendChild(titulo);
        info.appendChild(detalhes);
        info.appendChild(fonte);

        const valorMeta = Number(investimento.meta);

        if (valorMeta > 0) {
            const textoMeta = document.createElement("span");
            textoMeta.className = "linha-meta sensivel";

            const pct = Math.min((valor.saldo / valorMeta) * 100, 100);

            textoMeta.textContent = `Meta: ${formatarMoeda(valorMeta)} · ` +
                `${pct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% concluído`;
            info.appendChild(textoMeta);
        }

        const direita = document.createElement("div");
        direita.className = "linha-direita";

        const valorTotal = document.createElement("span");
        valorTotal.className = "linha-valor sensivel";
        valorTotal.textContent = formatarMoeda(valor.saldo);

        const aportadoTexto = document.createElement("span");
        aportadoTexto.className = "linha-meta sensivel";
        aportadoTexto.textContent = `investido ${formatarMoeda(valor.aportado)}`;

        const lucro = document.createElement("span");
        lucro.className = "linha-meta sensivel " + (valor.lucroMes >= 0 ? "nota-positiva" : "nota-negativa");
        lucro.textContent = `${formatarComSinal(valor.lucroMes)} no mês`;

        direita.appendChild(valorTotal);
        direita.appendChild(aportadoTexto);
        direita.appendChild(lucro);

        const botaoExcluir = criarBotaoIcone("excluir", "Excluir investimento", function() {
            excluirInvestimento(investimento.id);
        });

        const botaoMeta = criarBotaoIcone("orcamento", "Definir meta do investimento", function() {
            definirMetaInvestimento(investimento.id);
        });

        const acoes = document.createElement("div");
        acoes.className = "linha-acoes";
        acoes.appendChild(botaoMeta);
        acoes.appendChild(botaoExcluir);

        item.appendChild(info);
        item.appendChild(direita);
        item.appendChild(acoes);

        listaInvestimentos.appendChild(item);
    });
}

// 24.9 Atualizar todas as APIs
function horaCurta(carimbo) {
    return new Date(carimbo).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function atualizarStatusApis() {
    const status = document.getElementById("status-cotacoes");
    const taxas = cacheApi.taxas || {};
    const partes = [];

    if (taxas.atualizadoEm) {
        partes.push(`Taxas do BCB: ${horaCurta(taxas.atualizadoEm)}`);
    } else if (cacheApi.erroTaxas) {
        partes.push("BCB indisponível (usando taxa estimada)");
    }

    if (investimentos.some(function(investimento) { return investimento.tipo === "Outro"; })) {
        partes.push(cacheApi.erroCotacoes ? "alguma cotação falhou" : "cotações em dia");
    }

    status.textContent = partes.length > 0 ? partes.join(" · ") : "Cotações ainda não atualizadas.";
}

let atualizandoApis = false;

async function atualizarTudoApis(forcar) {
    if (atualizandoApis || navigator.onLine === false) {
        return;
    }

    atualizandoApis = true;

    try {
        await Promise.allSettled([
            atualizarTaxasBCB(forcar),
            atualizarCotacoesAtivos(forcar),
            atualizarCotacaoMoedas(forcar)
        ]);
    } finally {
        atualizandoApis = false;
    }

    salvarCacheApi();
    preencherCotacoesDosAportes();

    atualizarCamposApi();
    atualizarResumoReserva();
    mostrarInvestimentos();
    atualizarMetasInicio();
    atualizarStatusApis();
    atualizarCotacaoTela();
}

document.getElementById("atualizar-cotacoes").addEventListener("click", function() {
    atualizarTudoApis(true);
});


// 24.10 Cotação do momento (guardada no aporte para calcular a quantidade comprada)
function cotacaoAtualDoInvestimento(id) {
    const cotacao = (cacheApi.cotacoes || {})[id];

    return cotacao && cotacao.preco > 0 ? cotacao.preco : null;
}

// Aportes feitos há pouco, antes de existir cotação, ganham a cotação do dia
function preencherCotacoesDosAportes() {
    let mudou = false;

    aportesInvestimentos.forEach(function(aporte) {
        if (aporte.cotacao > 0 || Date.now() - (aporte.registradoEm || 0) > 86400000) {
            return;
        }

        const preco = cotacaoAtualDoInvestimento(aporte.investimentoId);

        if (preco) {
            aporte.cotacao = preco;
            mudou = true;
        }
    });

    if (mudou) {
        localStorage.setItem("aportesInvestimentos", JSON.stringify(aportesInvestimentos));
    }
}

// 14.6.2 Definir (ou remover) a meta de um investimento
async function definirMetaInvestimento(id) {
    const investimento = investimentos.find(function(item) {
        return item.id === id;
    });

    if (!investimento) {
        return;
    }

    const resposta = await perguntar({
        icone: "meta",
        titulo: "Meta do investimento",
        mensagem: `Quanto você quer juntar em "${investimento.nome || investimento.tipo}"? Deixe vazio para remover a meta.`,
        rotulo: "Meta (R$)",
        placeholder: "Ex.: 10000",
        valor: Number(investimento.meta) > 0 ? investimento.meta : ""
    });

    if (resposta === null) {
        return;
    }

    const texto = resposta.trim().replace(",", ".");

    if (texto === "") {
        delete investimento.meta;
    } else {
        const valor = Number(texto);

        if (!Number.isFinite(valor) || valor <= 0) {
            mostrarAviso("Informe um valor maior que zero.");
            return;
        }

        investimento.meta = valor;
    }

    localStorage.setItem("investimentos", JSON.stringify(investimentos));

    mostrarInvestimentos();
    atualizarResumoReserva();
    atualizarPainel();
}

// 14.7 Atualizar opções de investimentos
function atualizarOpcoesInvestimentos() {
    investimentoAporteReserva.innerHTML = "";

    const opcaoInicial = document.createElement("option");
    opcaoInicial.value = "";
    opcaoInicial.textContent = "Selecione um investimento";
    investimentoAporteReserva.appendChild(opcaoInicial);

    investimentos.forEach(function(investimento) {
        const opcao = document.createElement("option");

        opcao.value = investimento.id;
        opcao.textContent = investimento.nome || investimento.tipo;
        investimentoAporteReserva.appendChild(opcao);
    });
}

// 14.8 Registrar novos aportes nos investimentos
formAporteReserva.addEventListener("submit", function(event) {
    event.preventDefault();

    const investimentoId = Number(investimentoAporteReserva.value);
    const valor = Number(valorAporteReserva.value);
    const data = dataAporteReserva.value;

    const investimentoExiste = investimentos.some(function(investimento) {
        return investimento.id === investimentoId;
    });

    if (!investimentoAporteReserva.value || !investimentoExiste) {
        mostrarAviso("Cadastre ou selecione um investimento válido.");
        return;
    }

    // Validar o valor e a data do aporte
    const dataTeste = new Date(`${data}T00:00:00`);

    if (
        !Number.isFinite(valor) ||
        valor <= 0 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
        Number.isNaN(dataTeste.getTime()) ||
        dataTeste.toISOString().slice(0, 10) !== data
    ) {
        mostrarAviso("Informe um valor positivo e uma data válida.");
        return;
    }

    aportesInvestimentos.push({
        investimentoId: investimentoId,
        valor: valor,
        data: data,
        registradoEm: Date.now(),
        cotacao: cotacaoAtualDoInvestimento(investimentoId)
    });

    localStorage.setItem(
        "aportesInvestimentos",
        JSON.stringify(aportesInvestimentos)
    );

    // Selecionar o mês do aporte no filtro mensal
    filtroMes.value = data.slice(0, 7);

    mostrarInvestimentos();
    atualizarOpcoesInvestimentos();
    atualizarHistorico();
    atualizarResumoMensal();
    atualizarSaldo();

    formAporteReserva.reset();
    abrirTela(secaoReserva, "menu");
});

// 14.10 Excluir investimentos
async function excluirInvestimento(id) {
    const investimento = investimentos.find(function(item) {
        return item.id === id;
    });

    if (!investimento) {
        mostrarAviso("Investimento não encontrado.");
        return;
    }

    if (!await confirmar({
        titulo: "Excluir investimento",
        mensagem: `Tem certeza de que deseja excluir "${investimento.nome || investimento.tipo}" e todos os aportes associados a ele?`,
        textoConfirmar: "Excluir",
        perigo: true
    })) {
        return;
    }

    // Remover o investimento
    investimentos = investimentos.filter(function(item) {
        return item.id !== id;
    });

    // Remover os aportes desse investimento
    aportesInvestimentos = aportesInvestimentos.filter(function(aporte) {
        return aporte.investimentoId !== id;
    });

    // Salvar as alterações
    localStorage.setItem(
        "investimentos",
        JSON.stringify(investimentos)
    );

    localStorage.setItem(
        "aportesInvestimentos",
        JSON.stringify(aportesInvestimentos)
    );

    if (cacheApi.cotacoes) {
        delete cacheApi.cotacoes[id];
        salvarCacheApi();
    }

    // Atualizar a tela e os cálculos
    mostrarInvestimentos();
    atualizarOpcoesInvestimentos();
    atualizarResumoMensal();
    atualizarSaldo();
    atualizarResumoReserva();
    atualizarPainel();

    mostrarAviso("Investimento excluído com sucesso.");
}

// 15. Backup e restauração dos dados

// 15.1 Elementos do HTML
const botaoBackup = document.getElementById("botao-backup");
const arquivoBackup = document.getElementById("arquivo-backup");

// 15.2 Fazer backup
botaoBackup.addEventListener("click", function() {
    // Reunir os dados do aplicativo
    let dadosBackup = {
        receitas: receitas,
        gastos: gastos,
        metas: metas,
        investimentos: investimentos,
        aportesInvestimentos: aportesInvestimentos,
        ocorrenciasExcluidas: ocorrenciasExcluidas,
        categorias: categorias,
        orcamentos: orcamentos
    };

    // Transformar os dados em JSON
    let dadosTexto = JSON.stringify(dadosBackup, null, 2);

    // Criar o arquivo
    let arquivo = new Blob([dadosTexto], {
        type: "application/json"
    });

    // Criar o endereço temporário
    let endereco = URL.createObjectURL(arquivo);

    // Criar o link de download
    let link = document.createElement("a");
    link.href = endereco;
    link.download = "backup-financeiro.json";
    link.click();

    // Liberar o endereço temporário após iniciar o download
    setTimeout(function() {
        URL.revokeObjectURL(endereco);
    }, 1000);
});

// 15.3 Restaurar backup
arquivoBackup.addEventListener("change", function() {
    let arquivo = arquivoBackup.files[0];

    if (!arquivo) {
        return;
    }

    let leitor = new FileReader();

    leitor.onload = async function(event) {
        try {
            let dadosBackup = JSON.parse(event.target.result);

            // Validar a estrutura básica do backup
            const backupValido =
                dadosBackup &&
                Array.isArray(dadosBackup.receitas) &&
                Array.isArray(dadosBackup.gastos) &&
                Array.isArray(dadosBackup.metas) &&
                (dadosBackup.investimentos === undefined ||
                    Array.isArray(dadosBackup.investimentos)) &&
                (dadosBackup.aportesInvestimentos === undefined ||
                    Array.isArray(dadosBackup.aportesInvestimentos)) &&
                dadosBackup.receitas.every(function(receita) {
                    return receita &&
                        typeof receita.mes === "string" &&
                        /^\d{4}-\d{2}$/.test(receita.mes) &&
                        Number.isFinite(Number(receita.valor)) &&
                        Number(receita.valor) > 0;
                }) &&
                dadosBackup.gastos.every(function(gasto) {
                    return gasto &&
                        typeof gasto.descricao === "string" &&
                        typeof gasto.data === "string" &&
                        /^\d{4}-\d{2}-\d{2}$/.test(gasto.data) &&
                        Number.isFinite(Number(gasto.valor)) &&
                        Number(gasto.valor) > 0 &&
                        typeof gasto.categoria === "string";
                }) &&
                dadosBackup.metas.every(function(meta) {
                    return meta &&
                        typeof meta.nome === "string" &&
                        Number.isFinite(Number(meta.valor)) &&
                        Number(meta.valor) > 0 &&
                        (meta.aportes === undefined ||
                            (Array.isArray(meta.aportes) &&
                                meta.aportes.every(function(aporte) {
                                    return aporte &&
                                        typeof aporte.data === "string" &&
                                        /^\d{4}-\d{2}-\d{2}$/.test(aporte.data) &&
                                        Number.isFinite(Number(aporte.valor)) &&
                                        Number(aporte.valor) > 0;
                                })));
                }) &&
                (dadosBackup.investimentos || []).every(function(investimento) {
                    return investimento &&
                        Number.isFinite(Number(investimento.id)) &&
                        typeof investimento.tipo === "string" &&
                        typeof investimento.nome === "string";
                }) &&
                (dadosBackup.aportesInvestimentos || []).every(function(aporte) {
                    return aporte &&
                        Number.isFinite(Number(aporte.investimentoId)) &&
                        typeof aporte.data === "string" &&
                        /^\d{4}-\d{2}-\d{2}$/.test(aporte.data) &&
                        Number.isFinite(Number(aporte.valor)) &&
                        Number(aporte.valor) > 0;
                });

            if (!backupValido) {
                mostrarAviso("O arquivo selecionado não é um backup válido.");
                arquivoBackup.value = "";
                return;
            }

            if (!await confirmar({
                icone: "restaurar",
                titulo: "Restaurar backup",
                mensagem: "Restaurar este backup substituirá os dados atuais. Deseja continuar?",
                textoConfirmar: "Restaurar",
                perigo: true
            })) {
                arquivoBackup.value = "";
                return;
            }

            // Preparar os dados restaurados antes de substituir os atuais
            const receitasRestauradas = dadosBackup.receitas;
            const gastosRestaurados = dadosBackup.gastos;
            const metasRestauradas = dadosBackup.metas.map(function(meta) {
                return {
                    ...meta,
                    aportes: Array.isArray(meta.aportes) ? meta.aportes : []
                };
            });
            const investimentosRestaurados = Array.isArray(dadosBackup.investimentos)
                ? dadosBackup.investimentos
                : [];
            const aportesInvestimentosRestaurados = Array.isArray(dadosBackup.aportesInvestimentos)
                ? dadosBackup.aportesInvestimentos
                : [];

            const ocorrenciasExcluidasRestauradas =
            Array.isArray(dadosBackup.ocorrenciasExcluidas)
                ? dadosBackup.ocorrenciasExcluidas
                : [];

            // Restaurar os dados nas listas
            receitas = receitasRestauradas;
            gastos = gastosRestaurados;
            metas = metasRestauradas;
            investimentos = investimentosRestaurados;
            aportesInvestimentos = aportesInvestimentosRestaurados;
            ocorrenciasExcluidas = ocorrenciasExcluidasRestauradas;

            // Categorias e orçamentos (backups antigos não têm: usa as categorias das despesas)
            categorias = Array.isArray(dadosBackup.categorias)
                ? dadosBackup.categorias.filter(function(nome) { return typeof nome === "string"; })
                : Array.from(new Set(gastos.map(function(gasto) { return gasto.categoria; })));

            orcamentos = (dadosBackup.orcamentos &&
                typeof dadosBackup.orcamentos === "object" &&
                !Array.isArray(dadosBackup.orcamentos))
                ? dadosBackup.orcamentos
                : {};

            // Salvar os dados no localStorage
            localStorage.setItem("receitas", JSON.stringify(receitas));
            localStorage.setItem("gastos", JSON.stringify(gastos));
            localStorage.setItem("metas", JSON.stringify(metas));
            localStorage.setItem("investimentos", JSON.stringify(investimentos));
            localStorage.setItem("aportesInvestimentos", JSON.stringify(aportesInvestimentos));
            localStorage.setItem("ocorrenciasExcluidas",JSON.stringify(ocorrenciasExcluidas));
            localStorage.setItem("categorias", JSON.stringify(categorias));
            salvarOrcamentos();

            // Atualizar a página
            carregarReceitaDoMes();
            mostrarGastos(gastos);
            mostrarMetas(metas);
            atualizarOpcoesMetas();
            atualizarHistorico();
            atualizarResumoMensal();
            mostrarInvestimentos();
            atualizarCategorias();
            atualizarOpcoesInvestimentos();
            atualizarSaldo();

            mostrarAviso("Backup restaurado com sucesso!");
        } catch (erro) {
            mostrarAviso("Não foi possível restaurar o backup. Verifique se o arquivo é válido e tente novamente.");
        }

        arquivoBackup.value = "";
    };

    leitor.readAsText(arquivo);
});

// 16. Alternar entre modo claro e modo escuro
const botoesTema = document.querySelectorAll(".botao-tema");

// 16.1 Alternar o tema ao clicar em qualquer botão de tema
botoesTema.forEach(function(botao) {
    botao.addEventListener("click", function() {
        document.body.classList.toggle("modo-claro");

        const claro = document.body.classList.contains("modo-claro");

        // Atualizar o texto dos botões conforme o tema ativo
        document.querySelectorAll(".texto-tema").forEach(function(texto) {
            texto.textContent = claro ? "Modo escuro" : "Modo claro";
        });

        try {
            localStorage.setItem("tema", claro ? "claro" : "escuro");
        } catch (erro) {
            // Sem armazenamento: apenas não lembra do tema
        }

        // Atualizar as cores dos gráficos
        aplicarTemaNosGraficos();
    });
});

// 17. Navegação entre as telas internas das seções (Despesas, Metas e Reserva)
const secaoGastos = document.getElementById("gastos");
const secaoMetas = document.getElementById("planejamento");
const secaoReserva = document.getElementById("reserva-emergencia");
const botaoRolar = document.getElementById("botao-rolar");

// 17.1 Data de hoje no formato AAAA-MM-DD
function dataDeHoje() {
    const hoje = new Date();

    return `${hoje.getFullYear()}-` +
        `${String(hoje.getMonth() + 1).padStart(2, "0")}-` +
        `${String(hoje.getDate()).padStart(2, "0")}`;
}

// 17.2 Abrir uma tela dentro de uma seção ("menu" é a tela principal)
function abrirTela(secao, nome, semRolar) {
    secao.querySelectorAll(".tela-despesas").forEach(function(tela) {
        tela.hidden = tela.dataset.tela !== nome;
    });

    // Sugerir a data de hoje nos formulários de cadastro
    if (secao === secaoGastos && nome === "cadastrar" && !campoData.value) {
        campoData.value = dataDeHoje();
    }

    if (secao === secaoMetas && nome === "aporte" && !dataAporte.value) {
        dataAporte.value = dataDeHoje();
    }

    if (secao === secaoReserva && nome === "aporte-reserva" && !dataAporteReserva.value) {
        dataAporteReserva.value = dataDeHoje();
    }

    if (secao === secaoReserva && nome === "simulador") {
        prepararSimulador();
    }

    if (!semRolar) {
        secao.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function abrirTelaDespesas(nome) {
    abrirTela(secaoGastos, nome);
}

// 17.3 Todos os botões com data-abrir mudam de tela dentro da própria seção
document.querySelectorAll("main > section").forEach(function(secao) {
    secao.querySelectorAll("[data-abrir]").forEach(function(botao) {
        botao.addEventListener("click", function() {
            abrirTela(secao, botao.dataset.abrir);
        });
    });
});

// 17.4 Filtro de período da tela "Despesas" (usa o mesmo filtro do resumo)
filtroMesDespesas.addEventListener("change", function() {
    filtroMes.value = filtroMesDespesas.value;
    filtroMes.dispatchEvent(new Event("change"));
});

// 17.5 Filtro de categoria do histórico
filtroHistoricoCategoria.addEventListener("change", mostrarHistoricoCompleto);

// 17.6 Botão redondo: descer para a próxima seção
botaoRolar.addEventListener("click", function() {
    abrirSecao("planejamento");
});


// ==========================================================
// 18. Painel: Início, Relatórios e Comparativo
// ==========================================================

// 18.1 Elementos do Início
const saldoTotal = document.getElementById("saldo-total");
const botaoOlho = document.getElementById("botao-olho");
const periodoInicio = document.getElementById("periodo-inicio");
const listaOrcamento = document.getElementById("lista-orcamento");
const orcamentoPeriodo = document.getElementById("orcamento-periodo");
const listaMetasInicio = document.getElementById("lista-metas-inicio");
const listaMovimentacoes = document.getElementById("lista-movimentacoes");
const listaMovimentacoesCompleta = document.getElementById("lista-movimentacoes-completa");
const filtroTipoMov = document.getElementById("filtro-tipo-mov");
const periodoComparativo = document.getElementById("periodo-comparativo");

// Elementos dos Relatórios
const filtroMesRelatorios = document.getElementById("filtro-mes-relatorios");

// Elementos do Comparativo
const compAno = document.getElementById("comp-ano");
const compComparar = document.getElementById("comp-comparar");
const compMetrica = document.getElementById("comp-metrica");
const campoMetrica = document.getElementById("campo-metrica");
const tituloComparativo = document.getElementById("titulo-comparativo");
const subtituloComparativo = document.getElementById("subtitulo-comparativo");
const variacaoGastos = document.getElementById("variacao-gastos");
const setaVariacao = document.getElementById("seta-variacao");
const textoVariacao = document.getElementById("texto-variacao");
const economiaMedia = document.getElementById("economia-media");
const textoEconomia = document.getElementById("texto-economia");
const tabelaBalanco = document.getElementById("tabela-balanco");

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

let graficoComparativo = null;

// 18.2 Mostrar ou ocultar os valores (ícone do olho)
function aplicarVisibilidadeValores(ocultar) {
    document.body.classList.toggle("ocultar-valores", ocultar);

    botaoOlho.setAttribute(
        "aria-label",
        ocultar ? "Mostrar valores" : "Ocultar valores"
    );

    try {
        localStorage.setItem("ocultarValores", ocultar ? "1" : "0");
    } catch (erro) {
        // Sem armazenamento: apenas não lembra da escolha
    }
}

botaoOlho.addEventListener("click", function() {
    aplicarVisibilidadeValores(!document.body.classList.contains("ocultar-valores"));
});

// 18.3 Saldo total acumulado
// Tudo que entrou menos tudo que saiu (despesas e aportes) até o mês atual
function calcularSaldoAcumulado() {
    let total = 0;

    receitas.forEach(function(receita) {
        const valor = Number(receita.valor);

        if (typeof receita.mes === "string" && receita.mes <= mesAtual && Number.isFinite(valor)) {
            total += valor;
        }
    });

    gastos.forEach(function(despesa) {
        const valor = Number(despesa.valor);

        if (despesaAtiva(despesa) && typeof despesa.data === "string" && despesa.data.slice(0, 7) <= mesAtual && Number.isFinite(valor)) {
            total -= valor;
        }
    });

    metas.forEach(function(meta) {
        (meta.aportes || []).forEach(function(aporte) {
            const valor = Number(aporte.valor);

            if (typeof aporte.data === "string" && aporte.data.slice(0, 7) <= mesAtual && Number.isFinite(valor)) {
                total -= valor;
            }
        });
    });

    aportesInvestimentos.forEach(function(aporte) {
        const valor = Number(aporte.valor);

        if (typeof aporte.data === "string" && aporte.data.slice(0, 7) <= mesAtual && Number.isFinite(valor)) {
            total -= valor;
        }
    });

    return total;
}

function atualizarSaldoTotal() {
    const saldo = calcularSaldoAcumulado();

    saldoTotal.textContent = formatarMoeda(saldo);
    saldoTotal.classList.toggle("valor-negativo", saldo < 0);

    const mesSelecionado = filtroMes.value;

    periodoInicio.textContent = mesSelecionado
        ? nomeDoMes(mesSelecionado)
        : "Todos os períodos";
}

// 18.4 Orçamento mensal por categoria
function atualizarOrcamento() {
    const mesSelecionado = filtroMes.value || mesAtual;

    orcamentoPeriodo.textContent = nomeDoMes(mesSelecionado);
    listaOrcamento.innerHTML = "";

    // Quanto foi gasto em cada categoria no mês
    const gastoPorCategoria = {};
    let totalMes = 0;

    gastos.forEach(function(despesa) {
        if (despesaAtiva(despesa) && typeof despesa.data === "string" && despesa.data.startsWith(mesSelecionado)) {
            const nome = despesa.categoria || "Sem categoria";
            const valor = Number(despesa.valor);

            if (Number.isFinite(valor)) {
                gastoPorCategoria[nome] = (gastoPorCategoria[nome] || 0) + valor;
                totalMes += valor;
            }
        }
    });

    // Categorias criadas + categorias que aparecem nas despesas
    const nomes = categorias.slice();

    Object.keys(gastoPorCategoria).forEach(function(nome) {
        if (!nomes.includes(nome)) {
            nomes.push(nome);
        }
    });

    // Mostrar somente as que têm gasto no mês ou orçamento definido
    const visiveis = nomes.filter(function(nome) {
        return (gastoPorCategoria[nome] || 0) > 0 || Number(orcamentos[nome]) > 0;
    });

    if (visiveis.length === 0) {
        let vazio = document.createElement("p");
        vazio.className = "vazio";
        vazio.textContent = "Nenhuma despesa neste mês.";
        listaOrcamento.appendChild(vazio);
        return;
    }

    visiveis.forEach(function(nome) {
        const gasto = gastoPorCategoria[nome] || 0;
        const limite = Number(orcamentos[nome]) > 0 ? Number(orcamentos[nome]) : 0;

        let linha = document.createElement("div");
        linha.className = "orc-linha";

        let topo = document.createElement("div");
        topo.className = "orc-topo";

        let rotulo = document.createElement("span");
        rotulo.className = "orc-nome";
        rotulo.textContent = nome;

        let valores = document.createElement("span");
        valores.className = "orc-valores sensivel";
        valores.textContent = formatarMoeda(gasto);

        if (limite > 0) {
            let pLimite = document.createElement("span");
            pLimite.className = "orc-limite";
            pLimite.textContent = ` / ${formatarMoeda(limite)}`;
            valores.appendChild(pLimite);
        }

        topo.appendChild(rotulo);
        topo.appendChild(valores);

        let fundo = document.createElement("div");
        fundo.className = "barra-progresso orc-barra";

        let preenchimento = document.createElement("div");
        preenchimento.className = "barra-progresso-preenchimento";

        let porcentagem;

        if (limite > 0) {
            porcentagem = (gasto / limite) * 100;

            // Passou do limite: barra vermelha
            preenchimento.classList.add(porcentagem >= 100 ? "orc-estourou" : "orc-normal");
        } else {
            // Sem limite: mostra a fatia da categoria no total do mês
            porcentagem = totalMes > 0 ? (gasto / totalMes) * 100 : 0;
            preenchimento.classList.add("orc-sem-limite");
        }

        preenchimento.style.width = `${Math.min(porcentagem, 100)}%`;

        fundo.appendChild(preenchimento);
        linha.appendChild(topo);
        linha.appendChild(fundo);
        listaOrcamento.appendChild(linha);
    });
}

// 18.5 Metas e reserva no Início
// Barra de progresso com nome, porcentagem, valor acumulado e meta
function criarBlocoProgresso(nomeBloco, acumulado, valorMeta, corSelo) {
    let porcentagem = valorMeta > 0 ? (acumulado / valorMeta) * 100 : 0;
    porcentagem = Math.min(porcentagem, 100);

    let bloco = document.createElement("div");
    bloco.className = "meta-mini";

    let topo = document.createElement("div");
    topo.className = "orc-topo";

    let nome = document.createElement("span");
    nome.className = "orc-nome";
    nome.textContent = nomeBloco;

    let selo = document.createElement("span");
    selo.className = "selo-pct" + (corSelo ? ` ${corSelo}` : "");
    selo.textContent = `${Math.round(porcentagem)}%`;

    topo.appendChild(nome);
    topo.appendChild(selo);

    let fundo = document.createElement("div");
    fundo.className = "barra-progresso";

    let preenchimento = document.createElement("div");
    preenchimento.className = "barra-progresso-preenchimento";
    preenchimento.style.width = `${porcentagem}%`;

    fundo.appendChild(preenchimento);

    let rodape = document.createElement("div");
    rodape.className = "item-meta-rodape";

    let textoAcumulado = document.createElement("span");
    textoAcumulado.className = "sensivel";
    textoAcumulado.textContent = formatarMoeda(acumulado);

    let textoMeta = document.createElement("span");
    textoMeta.className = "sensivel";
    textoMeta.textContent = `Meta: ${formatarMoeda(valorMeta)}`;

    rodape.appendChild(textoAcumulado);
    rodape.appendChild(textoMeta);

    bloco.appendChild(topo);
    bloco.appendChild(fundo);
    bloco.appendChild(rodape);

    return bloco;
}

// Quanto já foi guardado nos investimentos que têm meta, e a soma das metas
function resumoMetaReserva(mes) {
    let acumulado = 0;
    let meta = 0;

    investimentos.forEach(function(investimento) {
        const valorMeta = Number(investimento.meta);

        if (!(valorMeta > 0)) {
            return;
        }

        meta += valorMeta;

        acumulado += valorDoInvestimento(investimento, mes || mesAtual).saldo;
    });

    return { acumulado: acumulado, meta: meta };
}

function atualizarMetasInicio() {
    listaMetasInicio.innerHTML = "";

    const reserva = resumoMetaReserva();

    if (metas.length === 0 && reserva.meta === 0) {
        let vazio = document.createElement("p");
        vazio.className = "vazio";
        vazio.textContent = "Nenhuma meta cadastrada.";
        listaMetasInicio.appendChild(vazio);
    }

    // Metas financeiras (até 3)
    metas.slice(0, 3).forEach(function(meta) {
        listaMetasInicio.appendChild(
            criarBlocoProgresso(meta.nome, calcularTotalAportes(meta), Number(meta.valor))
        );
    });

    // Reserva de emergência (somente quando tem meta definida)
    if (reserva.meta > 0) {
        listaMetasInicio.appendChild(
            criarBlocoProgresso("Reserva de emergência", reserva.acumulado, reserva.meta, "selo-dourado")
        );
    }

    // Total guardado nos investimentos da reserva
    let totalReserva = document.createElement("div");
    totalReserva.className = "reserva-mini";

    let rotuloReserva = document.createElement("span");
    rotuloReserva.textContent = "Reserva acumulada atual";

    let valorReserva = document.createElement("strong");
    valorReserva.className = "sensivel";
    valorReserva.textContent = formatarMoeda(calcularReservaAtualizada());

    totalReserva.appendChild(rotuloReserva);
    totalReserva.appendChild(valorReserva);
    listaMetasInicio.appendChild(totalReserva);
}

// 18.6 Movimentações (receitas, despesas, contas recorrentes pagas e aportes)

// "2026-10-27" a partir de um carimbo de data (milissegundos)
function dataDoCarimbo(carimbo) {
    const data = new Date(carimbo);

    return `${data.getFullYear()}-` +
        `${String(data.getMonth() + 1).padStart(2, "0")}-` +
        `${String(data.getDate()).padStart(2, "0")}`;
}

// Junta tudo o que aconteceu até hoje, do mais recente para o mais antigo
function coletarMovimentacoes() {
    const hoje = dataDeHoje();
    const itens = [];

    receitas.forEach(function(receita) {
        lancamentosDaReceita(receita).forEach(function(lancamento) {
            const valor = Number(lancamento.valor);
            const data = lancamento.registradoEm
                ? dataDoCarimbo(lancamento.registradoEm)
                : `${receita.mes}-01`;

            if (data <= hoje && Number.isFinite(valor)) {
                itens.push({
                    tipo: "receita",
                    titulo: lancamento.descricao || "Receita mensal",
                    detalhe: `Receita de ${nomeDoMes(receita.mes).toLowerCase()}`,
                    data: data,
                    ordem: lancamento.registradoEm || 0,
                    valor: valor
                });
            }
        });
    });

    gastos.forEach(function(despesa) {
        const valor = Number(despesa.valor);

        if (typeof despesa.data !== "string" || !Number.isFinite(valor)) {
            return;
        }

        if (!despesaAtiva(despesa)) {
            return;
        }

        if (despesa.recorrente || despesa.parcela) {
            // Conta recorrente ou parcela: só entra aqui quando é marcada como paga
            if (!despesa.paga) {
                return;
            }

            const dataPagamento = despesa.dataPagamento || despesa.data;

            if (dataPagamento <= hoje) {
                itens.push({
                    tipo: "despesa",
                    titulo: tituloDaDespesa(despesa),
                    detalhe: `${despesa.parcela ? "Parcela do cartão paga" : "Conta recorrente paga"} · ${despesa.categoria || "Sem categoria"}`,
                    data: dataPagamento,
                    ordem: despesa.pagoEm || 0,
                    valor: valor
                });
            }

            return;
        }

        if (despesa.data <= hoje) {
            itens.push({
                tipo: "despesa",
                titulo: tituloDaDespesa(despesa),
                detalhe: despesa.categoria || "Sem categoria",
                data: despesa.data,
                ordem: 0,
                valor: valor
            });
        }
    });

    metas.forEach(function(meta) {
        (meta.aportes || []).forEach(function(aporte) {
            const valor = Number(aporte.valor);

            if (typeof aporte.data === "string" && aporte.data <= hoje && Number.isFinite(valor)) {
                itens.push({
                    tipo: "meta",
                    titulo: `Aporte na meta ${meta.nome}`,
                    detalhe: "Meta financeira",
                    data: aporte.data,
                    ordem: aporte.registradoEm || 0,
                    valor: valor
                });
            }
        });
    });

    aportesInvestimentos.forEach(function(aporte) {
        const valor = Number(aporte.valor);

        if (typeof aporte.data === "string" && aporte.data <= hoje && Number.isFinite(valor)) {
            const investimento = investimentos.find(function(item) {
                return item.id === aporte.investimentoId;
            });

            itens.push({
                tipo: "reserva",
                titulo: "Aporte na reserva",
                detalhe: investimento ? (investimento.nome || investimento.tipo) : "Reserva de emergência",
                data: aporte.data,
                ordem: aporte.registradoEm || 0,
                valor: valor
            });
        }
    });

    itens.sort(function(a, b) {
        return b.data.localeCompare(a.data) || b.ordem - a.ordem;
    });

    return itens;
}

const ICONES_MOVIMENTACAO = {
    receita: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    despesa: '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>',
    meta: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    reserva: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'
};

// Uma linha da lista de movimentações
function criarLinhaMovimentacao(movimento) {
    let item = document.createElement("li");

    let icone = document.createElement("span");
    icone.className = `mov-icone mov-${movimento.tipo}`;
    icone.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES_MOVIMENTACAO[movimento.tipo]}</svg>`;

    let info = document.createElement("div");
    info.className = "linha-info";

    let titulo = document.createElement("strong");
    titulo.className = "linha-titulo";
    titulo.textContent = movimento.titulo;

    let meta = document.createElement("span");
    meta.className = "linha-meta";
    meta.textContent = `${formatarDataBR(movimento.data)} · ${movimento.detalhe}`;

    info.appendChild(titulo);
    info.appendChild(meta);

    let valor = document.createElement("span");
    valor.className = `linha-valor sensivel mov-valor-${movimento.tipo}`;

    if (movimento.tipo === "receita") {
        valor.textContent = "+ " + formatarMoeda(movimento.valor);
    } else if (movimento.tipo === "despesa") {
        valor.textContent = "- " + formatarMoeda(movimento.valor);
    } else {
        valor.textContent = formatarMoeda(movimento.valor);
    }

    item.appendChild(icone);
    item.appendChild(info);
    item.appendChild(valor);

    return item;
}

// Início: as 5 mais recentes
function atualizarMovimentacoes() {
    listaMovimentacoes.innerHTML = "";

    const itens = coletarMovimentacoes();

    if (itens.length === 0) {
        let vazio = document.createElement("li");
        vazio.className = "vazio";
        vazio.textContent = "Nenhuma movimentação ainda.";
        listaMovimentacoes.appendChild(vazio);
        return;
    }

    itens.slice(0, 5).forEach(function(movimento) {
        listaMovimentacoes.appendChild(criarLinhaMovimentacao(movimento));
    });
}

// Tela "Últimas movimentações": tudo, agrupado por mês e com filtro por tipo
function mostrarMovimentacoesCompletas() {
    listaMovimentacoesCompleta.innerHTML = "";

    const tipo = filtroTipoMov.value;
    const itens = coletarMovimentacoes().filter(function(movimento) {
        return !tipo || movimento.tipo === tipo;
    });

    if (itens.length === 0) {
        let vazio = document.createElement("p");
        vazio.className = "vazio";
        vazio.textContent = "Nenhuma movimentação encontrada.";
        listaMovimentacoesCompleta.appendChild(vazio);
        return;
    }

    const grupos = {};

    itens.forEach(function(movimento) {
        const chave = movimento.data.slice(0, 7);

        if (!grupos[chave]) {
            grupos[chave] = [];
        }

        grupos[chave].push(movimento);
    });

    Object.keys(grupos).sort().reverse().forEach(function(chave) {
        let grupo = document.createElement("div");
        grupo.className = "grupo-mes";

        let topo = document.createElement("div");
        topo.className = "grupo-mes-topo";

        let nome = document.createElement("span");
        nome.className = "grupo-mes-nome";
        nome.textContent = nomeDoMes(chave);

        let total = document.createElement("span");
        total.className = "grupo-mes-total";
        total.textContent = grupos[chave].length === 1
            ? "1 movimentação"
            : `${grupos[chave].length} movimentações`;

        topo.appendChild(nome);
        topo.appendChild(total);
        grupo.appendChild(topo);

        let lista = document.createElement("ul");
        lista.className = "lista-despesas";

        grupos[chave].forEach(function(movimento) {
            lista.appendChild(criarLinhaMovimentacao(movimento));
        });

        grupo.appendChild(lista);
        listaMovimentacoesCompleta.appendChild(grupo);
    });
}

filtroTipoMov.addEventListener("change", mostrarMovimentacoesCompletas);

// ==========================================================
// 19. Comparativo (meses e anos)
// ==========================================================

// 19.1 Totais de cada mês de um ano
function totaisDoAno(anoEscolhido) {
    const recMes = new Array(12).fill(0);
    const despMes = new Array(12).fill(0);

    receitas.forEach(function(receita) {
        const valor = Number(receita.valor);

        if (typeof receita.mes === "string" &&
            receita.mes.startsWith(`${anoEscolhido}-`) &&
            Number.isFinite(valor)) {
            recMes[Number(receita.mes.slice(5, 7)) - 1] += valor;
        }
    });

    gastos.forEach(function(despesa) {
        const valor = Number(despesa.valor);

        if (despesaAtiva(despesa) &&
            typeof despesa.data === "string" &&
            despesa.data.startsWith(`${anoEscolhido}-`) &&
            Number.isFinite(valor)) {
            despMes[Number(despesa.data.slice(5, 7)) - 1] += valor;
        }
    });

    return {
        receitas: recMes,
        despesas: despMes,
        resultado: recMes.map(function(valor, indice) {
            return valor - despMes[indice];
        })
    };
}

// 19.2 Anos que aparecem nas opções (dados salvos + ano atual e anterior)
function anosDisponiveis() {
    const anoCorrente = Number(mesAtual.slice(0, 4));
    const anos = new Set([anoCorrente, anoCorrente - 1]);

    receitas.forEach(function(receita) {
        if (typeof receita.mes === "string") {
            anos.add(Number(receita.mes.slice(0, 4)));
        }
    });

    gastos.forEach(function(despesa) {
        if (typeof despesa.data === "string") {
            anos.add(Number(despesa.data.slice(0, 4)));
        }
    });

    return Array.from(anos)
        .filter(Number.isFinite)
        .sort(function(a, b) { return b - a; });
}

// 19.3 Mês anterior: "2026-10" -> "2026-09"
function mesAnterior(mesAno) {
    const partes = mesAno.split("-").map(Number);
    const data = new Date(partes[0], partes[1] - 2, 1);

    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

// 19.4 Último mês com dados (1 a 12; 0 quando o ano está vazio)
function ultimoMesComDados(totais) {
    let ultimo = 0;

    for (let i = 0; i < 12; i++) {
        if (totais.receitas[i] > 0 || totais.despesas[i] > 0) {
            ultimo = i + 1;
        }
    }

    return ultimo;
}

// 19.4.1 Quantos meses do ano entram no gráfico (o ano atual para no mês atual)
function mesesVisiveisDoAno(anoEscolhido, totais) {
    if (anoEscolhido !== Number(mesAtual.slice(0, 4))) {
        return 12;
    }

    return Math.max(Number(mesAtual.slice(5, 7)), ultimoMesComDados(totais));
}

// 19.5 Opções do gráfico de linhas
function opcoesGraficoLinha(cores) {
    const tooltip = estiloTooltip(cores, true, function(item) {
        return ` ${item.dataset.label}: ${formatarMoeda(item.parsed.y)}`;
    });

    tooltip.displayColors = true;
    tooltip.usePointStyle = true;

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        animation: { duration: 700, easing: "easeOutQuart" },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: cores.textoSecundario }
            },
            y: {
                grace: "8%",
                border: { display: false },
                grid: { color: cores.borda },
                ticks: {
                    color: cores.textoSecundario,
                    maxTicksLimit: 6,
                    callback: function(valor) {
                        return valor.toLocaleString("pt-BR");
                    }
                }
            }
        },
        plugins: {
            legend: {
                position: "top",
                labels: {
                    color: cores.textoSecundario,
                    boxWidth: 30,
                    boxHeight: 12,
                    useBorderRadius: true,
                    borderRadius: 3,
                    padding: 16
                }
            },
            tooltip: tooltip
        }
    };
}

// 19.6 Criar uma linha do gráfico (curva suave, pontos vazados e sem preenchimento)
function criarLinha(rotulo, dados, cor, tracejada, corFundoPonto) {
    return {
        label: rotulo,
        data: dados,
        borderColor: cor,
        backgroundColor: "transparent",
        fill: false,
        tension: 0.4,
        borderWidth: 2.5,
        borderDash: tracejada ? [6, 4] : [],
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: corFundoPonto,
        pointBorderColor: cor,
        pointBorderWidth: 2
    };
}

// 19.7 Uma célula da tabela
function criarCelula(tag, texto, classe) {
    let celula = document.createElement(tag);
    celula.textContent = texto;

    if (classe) {
        celula.className = classe;
    }

    return celula;
}

function somar(lista) {
    return lista.reduce(function(soma, valor) {
        return soma + valor;
    }, 0);
}

// 19.8 Variação em porcentagem: "+12%" (vazio quando não dá para calcular)
function formatarVariacao(atual, anterior) {
    if (!(anterior > 0)) {
        return "—";
    }

    const porcentagem = ((atual - anterior) / anterior) * 100;

    return (porcentagem > 0 ? "+" : "") +
        porcentagem.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + "%";
}

// 19.9 Montar a tabela "Balanço por mês"
function montarTabela(totais, totaisB, anoA, anoB, metrica) {
    tabelaBalanco.innerHTML = "";

    let cabecalho = document.createElement("thead");
    let linhaCab = document.createElement("tr");

    let corpo = document.createElement("tbody");
    let rodape = document.createElement("tfoot");

    // Para despesas, aumentar é ruim (vermelho); nos demais, é bom (verde)
    const aumentoEhRuim = metrica === "despesas";

    if (!totaisB) {
        linhaCab.appendChild(criarCelula("th", "Mês"));
        linhaCab.appendChild(criarCelula("th", "Receitas", "col-receita"));
        linhaCab.appendChild(criarCelula("th", "Despesas", "col-despesa"));
        linhaCab.appendChild(criarCelula("th", "Resultado"));

        MESES_ABREV.forEach(function(nomeMes, i) {
            let linha = document.createElement("tr");

            linha.appendChild(criarCelula("td", nomeMes));
            linha.appendChild(criarCelula("td", formatarMoeda(totais.receitas[i]), "col-receita sensivel"));
            linha.appendChild(criarCelula("td", formatarMoeda(totais.despesas[i]), "col-despesa sensivel"));
            linha.appendChild(criarCelula(
                "td",
                formatarMoeda(totais.resultado[i]),
                "sensivel " + (totais.resultado[i] < 0 ? "valor-negativo" : "valor-positivo")
            ));

            corpo.appendChild(linha);
        });

        let total = document.createElement("tr");
        const totalResultado = somar(totais.resultado);

        total.appendChild(criarCelula("td", "Total"));
        total.appendChild(criarCelula("td", formatarMoeda(somar(totais.receitas)), "col-receita sensivel"));
        total.appendChild(criarCelula("td", formatarMoeda(somar(totais.despesas)), "col-despesa sensivel"));
        total.appendChild(criarCelula(
            "td",
            formatarMoeda(totalResultado),
            "sensivel " + (totalResultado < 0 ? "valor-negativo" : "valor-positivo")
        ));
        rodape.appendChild(total);
    } else {
        linhaCab.appendChild(criarCelula("th", "Mês"));
        linhaCab.appendChild(criarCelula("th", String(anoA)));
        linhaCab.appendChild(criarCelula("th", String(anoB)));
        linhaCab.appendChild(criarCelula("th", "Variação"));

        // Linha com a variação colorida
        const criarLinhaComparada = function(rotulo, valorA, valorB) {
            let linha = document.createElement("tr");
            let classeVariacao = "";

            if (valorB > 0 && valorA !== valorB) {
                const subiu = valorA > valorB;
                classeVariacao = (subiu === aumentoEhRuim) ? "valor-negativo" : "valor-positivo";
            }

            linha.appendChild(criarCelula("td", rotulo));
            linha.appendChild(criarCelula("td", formatarMoeda(valorA), "sensivel"));
            linha.appendChild(criarCelula("td", formatarMoeda(valorB), "sensivel"));
            linha.appendChild(criarCelula("td", formatarVariacao(valorA, valorB), classeVariacao));

            return linha;
        };

        MESES_ABREV.forEach(function(nomeMes, i) {
            corpo.appendChild(criarLinhaComparada(nomeMes, totais[metrica][i], totaisB[metrica][i]));
        });

        rodape.appendChild(criarLinhaComparada("Total", somar(totais[metrica]), somar(totaisB[metrica])));
    }

    cabecalho.appendChild(linhaCab);
    tabelaBalanco.appendChild(cabecalho);
    tabelaBalanco.appendChild(corpo);
    tabelaBalanco.appendChild(rodape);
}

// 19.10 Atualizar toda a aba Comparativo
function atualizarComparativo() {
    const anoCorrente = Number(mesAtual.slice(0, 4));
    const anos = anosDisponiveis();

    // Opções de ano (mantém a escolha atual, se ainda existir)
    let anoEscolhido = Number(compAno.value);

    if (!anos.includes(anoEscolhido)) {
        anoEscolhido = anoCorrente;
    }

    compAno.innerHTML = "";

    anos.forEach(function(ano) {
        let opcao = document.createElement("option");
        opcao.value = ano;
        opcao.textContent = `Ano ${ano}`;
        compAno.appendChild(opcao);
    });

    compAno.value = anoEscolhido;

    // Opções de "comparar com" (todos os anos, menos o escolhido)
    let anoComparado = compComparar.value;

    compComparar.innerHTML = "";

    let opcaoNenhum = document.createElement("option");
    opcaoNenhum.value = "";
    opcaoNenhum.textContent = "Não comparar";
    compComparar.appendChild(opcaoNenhum);

    anos.filter(function(ano) {
        return ano !== anoEscolhido;
    }).forEach(function(ano) {
        let opcao = document.createElement("option");
        opcao.value = ano;
        opcao.textContent = `Ano ${ano}`;
        compComparar.appendChild(opcao);
    });

    if (!Array.from(compComparar.options).some(function(opcao) { return opcao.value === anoComparado; })) {
        anoComparado = "";
    }

    compComparar.value = anoComparado;

    const comparando = anoComparado !== "";
    const totaisA = totaisDoAno(anoEscolhido);
    const totaisB = comparando ? totaisDoAno(Number(anoComparado)) : null;

    // A escolha da métrica só aparece ao comparar anos
    campoMetrica.hidden = !comparando;

    const metrica = compMetrica.value;
    const nomesMetrica = { despesas: "Despesas", receitas: "Receitas", resultado: "Resultado" };
    const coresMetrica = { despesas: COR_DESPESA, receitas: COR_RECEITA, resultado: COR_SALDO };

    // ---- Cards do topo ----
    const mesSelecionado = filtroMes.value || mesAtual;
    periodoComparativo.textContent = nomeDoMes(mesSelecionado).replace(" de ", " ");
    const despesasAtual = somarDespesasDoMes(mesSelecionado);
    const despesasAnterior = somarDespesasDoMes(mesAnterior(mesSelecionado));

    if (despesasAnterior > 0) {
        const diferenca = despesasAtual - despesasAnterior;

        variacaoGastos.textContent = formatarVariacao(despesasAtual, despesasAnterior);
        variacaoGastos.className = diferenca > 0 ? "valor-negativo" : (diferenca < 0 ? "valor-positivo" : "");

        setaVariacao.innerHTML = diferenca < 0
            ? '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'
            : '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>';
        setaVariacao.setAttribute("class", diferenca > 0 ? "icone-erro" : (diferenca < 0 ? "icone-verde" : ""));

        textoVariacao.textContent =
            `Compara ${nomeDoMes(mesSelecionado).toLowerCase()} com o anterior`;
    } else {
        variacaoGastos.textContent = "—";
        variacaoGastos.className = "";
        setaVariacao.innerHTML = '<path d="M5 12h14"/>';
        setaVariacao.setAttribute("class", "");
        textoVariacao.textContent = "Sem despesas no mês anterior para comparar";
    }

    // Economia média: média do resultado dos meses que têm movimento
    const mesesComDados = totaisA.resultado.filter(function(valor, i) {
        return totaisA.receitas[i] > 0 || totaisA.despesas[i] > 0;
    });

    const media = mesesComDados.length > 0
        ? somar(mesesComDados) / mesesComDados.length
        : 0;

    economiaMedia.textContent = formatarMoeda(media);
    economiaMedia.className = "sensivel " + (media < 0 ? "valor-negativo" : "valor-positivo");
    textoEconomia.textContent = `Média mensal guardada em ${anoEscolhido}`;

    // ---- Títulos do gráfico ----
    if (comparando) {
        tituloComparativo.textContent =
            `${nomesMetrica[metrica]}: ${anoEscolhido} × ${anoComparado}`;
        subtituloComparativo.textContent = "Compare o mesmo mês entre os dois anos.";
    } else {
        tituloComparativo.textContent = "Comparativo de evolução mensal / anual";
        subtituloComparativo.textContent =
            "Acompanhe a variação entre meses ao longo do tempo.";
    }

    // ---- Gráfico ----
    if (typeof Chart !== "undefined") {
        const cores = coresDoTema();
        const limiteA = mesesVisiveisDoAno(anoEscolhido, totaisA);

        // Meses que ainda não aconteceram ficam vazios (sem linha)
        const ateOLimite = function(lista, limite) {
            return lista.map(function(valor, i) {
                return i < limite ? valor : null;
            });
        };

        let rotulos;
        let linhas;

        if (comparando) {
            const limiteB = mesesVisiveisDoAno(Number(anoComparado), totaisB);

            rotulos = MESES_ABREV;
            linhas = [
                criarLinha(`${nomesMetrica[metrica]} ${anoEscolhido}`, ateOLimite(totaisA[metrica], limiteA),
                    coresMetrica[metrica], false, cores.cartao),
                criarLinha(`${nomesMetrica[metrica]} ${anoComparado}`, ateOLimite(totaisB[metrica], limiteB),
                    "#F0B93B", true, cores.cartao)
            ];
        } else {
            rotulos = MESES_ABREV.slice(0, limiteA);
            linhas = [
                criarLinha("Receitas", totaisA.receitas.slice(0, limiteA), COR_RECEITA, false, cores.cartao),
                criarLinha("Despesas", totaisA.despesas.slice(0, limiteA), COR_DESPESA, false, cores.cartao)
            ];
        }

        const dados = { labels: rotulos, datasets: linhas };

        if (graficoComparativo) {
            graficoComparativo.data = dados;
            graficoComparativo.options = opcoesGraficoLinha(cores);
            graficoComparativo.update();
        } else {
            graficoComparativo = new Chart(document.getElementById("grafico-comparativo"), {
                type: "line",
                data: dados,
                options: opcoesGraficoLinha(cores)
            });
        }
    }

    // ---- Tabela ----
    montarTabela(totaisA, totaisB, anoEscolhido, anoComparado, metrica);
}

compAno.addEventListener("change", atualizarComparativo);
compComparar.addEventListener("change", atualizarComparativo);
compMetrica.addEventListener("change", atualizarComparativo);

// 19.11 Atualizar todo o painel (chamado sempre que os dados mudam)
function atualizarPainel() {
    atualizarSaldoTotal();
    atualizarOrcamento();
    atualizarMetasInicio();
    atualizarMovimentacoes();
    mostrarMovimentacoesCompletas();
    atualizarComparativo();
    atualizarVencimentos();
    atualizarCotacaoTela();
}


// ==========================================================
// 20. Menu principal: lateral (PC) e inferior (celular)
// ==========================================================

// 20.1 Itens do menu (a ordem aqui é a ordem na tela)
const ITENS_MENU = [
    {
        id: "inicio", rotulo: "Início", grupo: "Painel",
        icone: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
    },
    {
        id: "relatorios", rotulo: "Relatórios", grupo: "Painel",
        icone: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>'
    },
    {
        id: "comparativo", rotulo: "Comparativo", grupo: "Painel",
        icone: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>'
    },
    {
        id: "gastos", rotulo: "Despesas", grupo: "Gerenciar",
        icone: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>'
    },
    {
        id: "planejamento", rotulo: "Metas", grupo: "Gerenciar",
        icone: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
    },
    {
        id: "reserva-emergencia", rotulo: "Reserva", grupo: "Gerenciar",
        icone: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'
    },
    {
        id: "backup", rotulo: "Backup", grupo: "Gerenciar",
        icone: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>'
    }
];

const secoesApp = document.querySelectorAll("main > section");

// 20.2 Criar um botão de menu (com ícone e texto)
function criarBotaoMenu(item, classe) {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = classe;
    botao.dataset.secao = item.id;
    botao.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${item.icone}</svg>`;

    const texto = document.createElement("span");
    texto.textContent = item.rotulo;
    botao.appendChild(texto);

    botao.addEventListener("click", function() {
        abrirSecao(item.id);

        // Ao trocar de seção pelo menu, volta para a tela principal dela
        const secao = document.getElementById(item.id);

        if (secao.querySelector(".tela-despesas")) {
            abrirTela(secao, "menu", true);
        }
    });

    return botao;
}

// 20.3 Montar o menu lateral e a barra inferior
function construirMenus() {
    const menuLateral = document.getElementById("menu-lateral-itens");
    const barraAbas = document.getElementById("barra-abas-itens");

    let grupoAtual = "";

    ITENS_MENU.forEach(function(item, indice) {
        // Menu lateral: itens separados por grupo
        if (item.grupo !== grupoAtual) {
            grupoAtual = item.grupo;

            let titulo = document.createElement("p");
            titulo.className = "menu-grupo-titulo";
            titulo.textContent = item.grupo;
            menuLateral.appendChild(titulo);

            // Barra inferior: uma linha fina separa "Painel" de "Gerenciar"
            if (indice > 0) {
                let separador = document.createElement("span");
                separador.className = "aba-separador";
                barraAbas.appendChild(separador);
            }
        }

        menuLateral.appendChild(criarBotaoMenu(item, "menu-item"));
        barraAbas.appendChild(criarBotaoMenu(item, "aba"));
    });
}

// 20.4 Abrir uma seção (as outras ficam escondidas)
function abrirSecao(id, primeiraVez) {
    const existe = Array.from(secoesApp).some(function(secao) {
        return secao.id === id;
    });

    if (!existe) {
        id = "inicio";
    }

    secoesApp.forEach(function(secao) {
        secao.hidden = secao.id !== id;
    });

    // Destacar o botão da seção aberta (nos dois menus)
    // (a tela de movimentações faz parte do Início)
    const idNoMenu = id === "movimentacoes" ? "inicio" : id;

    document.querySelectorAll("[data-secao]").forEach(function(botao) {
        const ativa = botao.dataset.secao === idNoMenu;

        botao.classList.toggle("ativa", ativa);

        if (ativa) {
            botao.setAttribute("aria-current", "page");
        } else {
            botao.removeAttribute("aria-current");
        }
    });

    try {
        localStorage.setItem("secaoAtual", id);
    } catch (erro) {
        // Sem armazenamento: apenas não lembra da última seção
    }

    // Gráficos que estavam escondidos precisam recalcular o tamanho
    [graficoResumoMensal, graficoDespesasCategoria, graficoComparativo].forEach(function(grafico) {
        // Só os gráficos que estão visíveis agora
        if (grafico && grafico.canvas.offsetParent !== null) {
            grafico.resize();
        }
    });

    window.scrollTo({ top: 0, behavior: primeiraVez ? "auto" : "smooth" });
}

// 20.5 Botões com data-ir: "secao" ou "secao:tela" (ex.: gastos:historico)
document.addEventListener("click", function(evento) {
    const alvo = evento.target.closest("[data-ir]");

    if (!alvo) {
        return;
    }

    const partes = alvo.dataset.ir.split(":");

    abrirSecao(partes[0]);

    if (partes[1]) {
        abrirTela(document.getElementById(partes[0]), partes[1], true);
    }
});

// 20.6 Filtro de período dos Relatórios (usa o mesmo filtro do resumo)
filtroMesRelatorios.addEventListener("change", function() {
    filtroMes.value = filtroMesRelatorios.value;
    filtroMes.dispatchEvent(new Event("change"));
});

// ==========================================================
// 23. Janela "Registrar receita mensal"
// ==========================================================
const modalReceita = document.getElementById("modal-receita");
const botaoAbrirReceita = document.getElementById("botao-abrir-receita");

// Primeira receita do mês: formulário simples. Mês com receita: dois botões.
function atualizarModoModalReceita() {
    const existente = receitas.find(function(receita) {
        return receita.mes === campoMesReceita.value;
    });

    document.getElementById("acoes-receita-nova").hidden = Boolean(existente);
    document.getElementById("acoes-receita-existente").hidden = !existente;

    const aviso = document.getElementById("receita-saldo-atual");

    aviso.hidden = !existente;

    if (existente) {
        aviso.innerHTML = "";
        aviso.append("Receita já registrada neste mês: ");

        const forte = document.createElement("strong");
        forte.textContent = formatarMoeda(existente.valor);
        aviso.appendChild(forte);
    }

    document.getElementById("modal-receita-titulo").textContent = existente
        ? "Registrar nova transação de receita"
        : "Registrar receita mensal";
}

function abrirModalReceita() {
    // Começa pelo mês que está em destaque no app
    campoMesReceita.value = filtroMes.value || mesAtual;
    carregarReceitaDoMes();

    modalReceita.hidden = false;
    document.body.classList.add("modal-aberto");
    campoReceita.focus();
}

function fecharModalReceita() {
    modalReceita.hidden = true;
    document.body.classList.remove("modal-aberto");
}

botaoAbrirReceita.addEventListener("click", abrirModalReceita);
document.getElementById("fechar-modal-receita").addEventListener("click", fecharModalReceita);
document.getElementById("cancelar-receita").addEventListener("click", fecharModalReceita);
document.getElementById("cancelar-receita-2").addEventListener("click", fecharModalReceita);
document.getElementById("receita-adicionar").addEventListener("click", function() {
    salvarReceita("novo");
});
document.getElementById("receita-ajustar").addEventListener("click", function() {
    salvarReceita("ajustar");
});

// Clicar fora da caixa também fecha
modalReceita.addEventListener("click", function(evento) {
    if (evento.target === modalReceita) {
        fecharModalReceita();
    }
});

document.addEventListener("keydown", function(evento) {
    if (evento.key === "Escape" && !modalReceita.hidden) {
        fecharModalReceita();
    }
});

// ==========================================================
// 22. Simulador da reserva e projeção futura
// ==========================================================
const simSaldo = document.getElementById("sim-saldo");
const simAporte = document.getElementById("sim-aporte");
const simRent = document.getElementById("sim-rent");
const simRentValor = document.getElementById("sim-rent-valor");
const simMeses = document.getElementById("sim-meses");
const simMesesAjuda = document.getElementById("sim-meses-ajuda");
const campoPrazoPersonalizado = document.getElementById("campo-prazo-personalizado");
const simTotal = document.getElementById("sim-total");
const simAportado = document.getElementById("sim-aportado");
const simJuros = document.getElementById("sim-juros");
const simPrazoTexto = document.getElementById("sim-prazo-texto");
const formSimulador = document.getElementById("form-simulador");

// Consulta específica por período
const simAbrirDetalhe = document.getElementById("sim-abrir-detalhe");
const simDetalhe = document.getElementById("sim-detalhe");
const simMesSelect = document.getElementById("sim-mes-select");
const simAbrirTabela = document.getElementById("sim-abrir-tabela");
const simTabelaWrap = document.getElementById("sim-tabela-wrap");
const simTabela = document.getElementById("sim-tabela");

let graficoSimulador = null;
let projecaoAtual = [];

// O saldo inicial vem da reserva até a pessoa digitar outro valor
let simSaldoEditado = false;

// 22.1 "30 meses" -> "2 anos e 6 meses"
function descreverPrazo(meses) {
    const anosInteiros = Math.floor(meses / 12);
    const restante = meses % 12;
    const partes = [];

    if (anosInteiros > 0) {
        partes.push(anosInteiros === 1 ? "1 ano" : `${anosInteiros} anos`);
    }

    if (restante > 0 || anosInteiros === 0) {
        partes.push(restante === 1 ? "1 mês" : `${restante} meses`);
    }

    return partes.join(" e ");
}

// 22.2 Quantidade de meses escolhida (botões ou prazo personalizado)
function mesesDaSimulacao() {
    const escolhido = document.querySelector('input[name="sim-prazo"]:checked').value;

    if (escolhido !== "personalizado") {
        return Number(escolhido);
    }

    const meses = Math.floor(Number(simMeses.value));

    if (!Number.isFinite(meses) || meses < 0) {
        return 0;
    }

    return Math.min(meses, 1200);
}

// 22.3 Calcular a projeção: o aporte entra no começo de cada mês e depois rende
// Devolve o total e também a linha de cada mês (para a consulta por período)
function calcularProjecao(saldoInicial, aporteMensal, taxaMensal, meses) {
    let saldo = saldoInicial;
    let jurosAcumulados = 0;
    const linhas = [];

    // A projeção começa no mês seguinte ao atual
    let mesDaLinha = mesAtual;

    for (let i = 1; i <= meses; i++) {
        const partes = mesDaLinha.split("-").map(Number);
        const data = new Date(partes[0], partes[1], 1);

        mesDaLinha = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;

        const antes = saldo + aporteMensal;
        const jurosDoMes = antes * taxaMensal;

        saldo = antes + jurosDoMes;
        jurosAcumulados += jurosDoMes;

        linhas.push({
            numero: i,
            mes: mesDaLinha,
            aporte: aporteMensal,
            jurosMes: jurosDoMes,
            saldo: saldo,
            aportadoAcumulado: saldoInicial + aporteMensal * i,
            jurosAcumulados: jurosAcumulados
        });
    }

    const aportado = saldoInicial + aporteMensal * meses;

    return {
        total: saldo,
        aportado: aportado,
        juros: saldo - aportado,
        linhas: linhas
    };
}

// "2029-02" -> "02/2029 (Fev/2029)"
function rotuloMesProjecao(mesAno) {
    return `${mesAno.slice(5, 7)}/${mesAno.slice(0, 4)} (${MESES_ABREV[Number(mesAno.slice(5, 7)) - 1]}/${mesAno.slice(0, 4)})`;
}

// 22.4 Atualizar a tela do simulador
function atualizarSimulador() {
    const saldoInicial = Math.max(Number(simSaldo.value) || 0, 0);
    const aporteMensal = Math.max(Number(simAporte.value) || 0, 0);
    const taxaPercentual = Math.max(Number(simRent.value) || 0, 0);
    const meses = mesesDaSimulacao();
    const personalizado = document.querySelector('input[name="sim-prazo"]:checked').value === "personalizado";

    simRentValor.textContent = `${taxaPercentual.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
    })}% a.m.`;

    campoPrazoPersonalizado.hidden = !personalizado;
    simMesesAjuda.textContent = meses > 0
        ? `${meses} ${meses === 1 ? "mês" : "meses"} = ${descreverPrazo(meses)}`
        : "Informe quantos meses você quer projetar (até 1.200).";

    const resultado = calcularProjecao(saldoInicial, aporteMensal, taxaPercentual / 100, meses);

    projecaoAtual = resultado.linhas;

    simTotal.textContent = formatarMoeda(resultado.total);
    simAportado.textContent = formatarMoeda(resultado.aportado);
    simJuros.textContent = formatarMoeda(resultado.juros);
    simPrazoTexto.textContent = meses > 0 ? `Projeção para ${descreverPrazo(meses)}.` : "";

    atualizarDetalheSimulador();
}

// 22.5 Consulta específica por período (mês escolhido, cards, gráfico e tabela)
function montarOpcoesMesSimulador() {
    const assinatura = projecaoAtual.length > 0
        ? `${projecaoAtual[0].mes}|${projecaoAtual.length}`
        : "vazio";

    if (simMesSelect.dataset.assinatura === assinatura) {
        return;
    }

    const anterior = simMesSelect.value;

    simMesSelect.dataset.assinatura = assinatura;
    simMesSelect.innerHTML = "";

    // Do mês mais distante para o mais próximo
    projecaoAtual.slice().reverse().forEach(function(linha) {
        const opcao = document.createElement("option");

        opcao.value = linha.mes;
        opcao.textContent = rotuloMesProjecao(linha.mes);
        simMesSelect.appendChild(opcao);
    });

    const existe = projecaoAtual.some(function(linha) {
        return linha.mes === anterior;
    });

    if (projecaoAtual.length > 0) {
        simMesSelect.value = existe ? anterior : projecaoAtual[projecaoAtual.length - 1].mes;
    }
}

function opcoesGraficoSimulador(cores) {
    const tooltip = estiloTooltip(cores, true, function(item) {
        return ` ${item.dataset.label}: ${formatarMoeda(item.parsed.y)}`;
    });

    tooltip.displayColors = true;

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        animation: { duration: 500 },
        elements: { point: { radius: 0, hoverRadius: 4 } },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: cores.textoSecundario, maxTicksLimit: 8, maxRotation: 0 }
            },
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: cores.borda },
                ticks: {
                    color: cores.textoSecundario,
                    maxTicksLimit: 6,
                    callback: function(valor) {
                        return "R$ " + (Math.abs(valor) >= 1000
                            ? (valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + "k"
                            : valor.toLocaleString("pt-BR"));
                    }
                }
            }
        },
        plugins: {
            legend: {
                position: "top",
                labels: { color: cores.textoSecundario, boxWidth: 26, boxHeight: 10, padding: 14 }
            },
            tooltip: tooltip
        }
    };
}

function atualizarGraficoSimulador() {
    if (typeof Chart === "undefined" || simDetalhe.hidden || projecaoAtual.length === 0) {
        return;
    }

    const cores = coresDoTema();
    const rotulos = projecaoAtual.map(function(linha) {
        return `${MESES_ABREV[Number(linha.mes.slice(5, 7)) - 1]}/${linha.mes.slice(0, 4)}`;
    });

    const dados = {
        labels: rotulos,
        datasets: [
            {
                label: "Total aportado",
                data: projecaoAtual.map(function(linha) { return linha.aportadoAcumulado; }),
                borderColor: cores.textoSecundario,
                backgroundColor: comTransparencia("#A1A1AA", 0.12),
                fill: true,
                tension: 0.3,
                borderWidth: 2
            },
            {
                label: "Juros acumulados",
                data: projecaoAtual.map(function(linha) { return linha.jurosAcumulados; }),
                borderColor: COR_RECEITA,
                backgroundColor: comTransparencia(COR_RECEITA, 0.18),
                fill: true,
                tension: 0.3,
                borderWidth: 2
            }
        ]
    };

    if (graficoSimulador) {
        graficoSimulador.data = dados;
        graficoSimulador.options = opcoesGraficoSimulador(cores);
        graficoSimulador.update();
    } else {
        graficoSimulador = new Chart(document.getElementById("grafico-simulador"), {
            type: "line",
            data: dados,
            options: opcoesGraficoSimulador(cores)
        });
    }
}

function montarTabelaSimulador() {
    simTabela.innerHTML = "";

    if (simTabelaWrap.hidden) {
        return;
    }

    const cabecalho = document.createElement("thead");
    const linhaCab = document.createElement("tr");

    ["Mês", "Aporte", "Juros do mês", "Saldo"].forEach(function(texto) {
        linhaCab.appendChild(criarCelula("th", texto));
    });

    cabecalho.appendChild(linhaCab);
    simTabela.appendChild(cabecalho);

    const corpo = document.createElement("tbody");

    projecaoAtual.forEach(function(linha) {
        const tr = document.createElement("tr");

        tr.appendChild(criarCelula("td", `${MESES_ABREV[Number(linha.mes.slice(5, 7)) - 1]}/${linha.mes.slice(2, 4)}`));
        tr.appendChild(criarCelula("td", formatarMoeda(linha.aporte)));
        tr.appendChild(criarCelula("td", formatarMoeda(linha.jurosMes), "col-receita"));
        tr.appendChild(criarCelula("td", formatarMoeda(linha.saldo)));

        if (simMesSelect.value === linha.mes) {
            tr.className = "linha-destacada";
        }

        corpo.appendChild(tr);
    });

    simTabela.appendChild(corpo);
}

function atualizarDetalheSimulador() {
    if (simDetalhe.hidden) {
        return;
    }

    montarOpcoesMesSimulador();

    const linha = projecaoAtual.find(function(item) {
        return item.mes === simMesSelect.value;
    });

    const zerar = !linha;

    document.getElementById("sim-stat-juros-mes").textContent = formatarMoeda(zerar ? 0 : linha.jurosMes);
    document.getElementById("sim-stat-saldo").textContent = formatarMoeda(zerar ? 0 : linha.saldo);
    document.getElementById("sim-stat-aportado").textContent = formatarMoeda(zerar ? 0 : linha.aportadoAcumulado);
    document.getElementById("sim-stat-juros-total").textContent = formatarMoeda(zerar ? 0 : linha.jurosAcumulados);

    atualizarGraficoSimulador();
    montarTabelaSimulador();
}

simAbrirDetalhe.addEventListener("click", function() {
    simDetalhe.hidden = !simDetalhe.hidden;
    simAbrirDetalhe.setAttribute("aria-expanded", String(!simDetalhe.hidden));
    simAbrirDetalhe.querySelector("span").textContent = simDetalhe.hidden
        ? "Ver rendimento detalhado por mês e ano"
        : "Ocultar rendimento detalhado";

    atualizarDetalheSimulador();
});

simAbrirTabela.addEventListener("click", function() {
    simTabelaWrap.hidden = !simTabelaWrap.hidden;
    simAbrirTabela.setAttribute("aria-expanded", String(!simTabelaWrap.hidden));
    simAbrirTabela.querySelector("span").textContent = simTabelaWrap.hidden
        ? "Ver tabela detalhada de todos os meses da projeção"
        : "Ocultar tabela detalhada";

    montarTabelaSimulador();
});

simMesSelect.addEventListener("change", atualizarDetalheSimulador);

// 22.6 Preencher o saldo inicial com o total da reserva ao abrir o simulador
function prepararSimulador() {
    if (!simSaldoEditado) {
        const reserva = calcularReservaAtualizada();
        simSaldo.value = reserva > 0 ? reserva.toFixed(2) : "";
    }

    atualizarSimulador();
}

simSaldo.addEventListener("input", function() {
    simSaldoEditado = true;
    atualizarSimulador();
});

[simAporte, simRent, simMeses].forEach(function(campo) {
    campo.addEventListener("input", atualizarSimulador);
});

document.querySelectorAll('input[name="sim-prazo"]').forEach(function(opcao) {
    opcao.addEventListener("change", atualizarSimulador);
});

formSimulador.addEventListener("submit", function(evento) {
    evento.preventDefault();
});



// ==========================================================
// 25. Início: vencimentos do mês e cotação de moedas
// ==========================================================

// 25.1 Vencimentos (contas recorrentes e parcelas do cartão)
const listaVencimentos = document.getElementById("lista-vencimentos");
const calendarioVencimentos = document.getElementById("calendario-vencimentos");
const botaoCalendario = document.getElementById("botao-calendario");

function ehConta(despesa) {
    return Boolean(despesa.recorrente || despesa.parcela);
}

// Nome curto: "AliExpress (2/4)"
function nomeDoVencimento(despesa) {
    return despesa.parcela
        ? `${despesa.descricao} (${despesa.parcela.numero}/${despesa.parcela.total})`
        : despesa.descricao;
}

// Agrupa as contas do mês por dia de vencimento
function vencimentosDoMes(mes) {
    const grupos = {};

    gastos.forEach(function(despesa) {
        if (ehConta(despesa) && despesaAtiva(despesa) && typeof despesa.data === "string" && despesa.data.startsWith(mes)) {
            if (!grupos[despesa.data]) {
                grupos[despesa.data] = [];
            }

            grupos[despesa.data].push(despesa);
        }
    });

    return Object.keys(grupos).sort().map(function(data) {
        const contas = grupos[data];
        const total = contas.reduce(function(soma, conta) {
            return soma + (Number(conta.valor) || 0);
        }, 0);

        return {
            data: data,
            contas: contas,
            nome: contas.length > 1
                ? `${nomeDoVencimento(contas[0])} + ${contas.length - 1} ${contas.length === 2 ? "conta" : "contas"}`
                : nomeDoVencimento(contas[0]),
            total: total,
            paga: contas.every(function(conta) { return conta.paga; })
        };
    });
}

function statusDoGrupo(grupo) {
    const pagas = grupo.contas.filter(function(conta) { return conta.paga; }).length;

    if (pagas === grupo.contas.length) {
        return { texto: "Pago", classe: "venc-pago" };
    }

    if (pagas === 0) {
        return { texto: "Pendente", classe: "venc-pendente" };
    }

    return { texto: `${pagas} de ${grupo.contas.length} pagas`, classe: "venc-pendente" };
}

function atualizarVencimentos() {
    const mes = filtroMes.value || mesAtual;
    const grupos = vencimentosDoMes(mes);

    listaVencimentos.innerHTML = "";

    if (grupos.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "vazio";
        vazio.textContent = "Nenhum vencimento neste mês.";
        listaVencimentos.appendChild(vazio);
    }

    grupos.forEach(function(grupo) {
        const cartao = document.createElement("div");
        const status = statusDoGrupo(grupo);

        cartao.className = "vencimento";

        // Data e situação do dia
        const topo = document.createElement("div");
        topo.className = "vencimento-topo";

        const data = document.createElement("span");
        data.className = "vencimento-data";
        data.textContent = formatarDataBR(grupo.data);

        const selo = document.createElement("span");
        selo.className = "vencimento-status " + status.classe;
        selo.textContent = status.texto;

        topo.appendChild(data);
        topo.appendChild(selo);
        cartao.appendChild(topo);

        // Uma conta embaixo da outra
        const contas = document.createElement("ul");
        contas.className = "vencimento-contas";

        grupo.contas.forEach(function(conta) {
            const linha = document.createElement("li");
            const ponto = document.createElement("span");
            const nome = document.createElement("span");
            const valor = document.createElement("span");

            ponto.className = "vc-ponto " + (conta.paga ? "venc-pago" : "venc-pendente");
            nome.className = "vc-nome";
            nome.textContent = nomeDoVencimento(conta);
            nome.title = nome.textContent;
            valor.className = "vc-valor sensivel";
            valor.textContent = formatarMoeda(Number(conta.valor) || 0);

            linha.appendChild(ponto);
            linha.appendChild(nome);
            linha.appendChild(valor);
            contas.appendChild(linha);
        });

        cartao.appendChild(contas);

        if (grupo.contas.length > 1) {
            const total = document.createElement("div");
            const rotulo = document.createElement("span");
            const valorTotal = document.createElement("strong");

            total.className = "vencimento-total";
            rotulo.textContent = "Total do dia";
            valorTotal.className = "sensivel";
            valorTotal.textContent = formatarMoeda(grupo.total);

            total.appendChild(rotulo);
            total.appendChild(valorTotal);
            cartao.appendChild(total);
        }

        listaVencimentos.appendChild(cartao);
    });

    montarCalendario(mes, grupos);
}

// Janelinha com as contas do dia (aparece ao passar o mouse, focar ou tocar no dia)
let dicaCalendario = null;
let celulaDaDica = null;

function esconderDicaCalendario() {
    if (dicaCalendario) {
        dicaCalendario.remove();
        dicaCalendario = null;
    }

    if (celulaDaDica) {
        celulaDaDica.classList.remove("cal-ativa");
        celulaDaDica = null;
    }
}

function mostrarDicaCalendario(celula, grupo) {
    if (celulaDaDica === celula) {
        return;
    }

    esconderDicaCalendario();

    const dia = Number(grupo.data.slice(8, 10));
    const nomeMes = NOMES_MESES_SELETOR[Number(grupo.data.slice(5, 7)) - 1].toLowerCase();
    const dica = document.createElement("div");
    const titulo = document.createElement("div");
    const lista = document.createElement("ul");

    dica.className = "cal-dica";
    dica.setAttribute("role", "tooltip");
    titulo.className = "cal-dica-titulo";
    titulo.textContent = `${dia} de ${nomeMes}`;
    lista.className = "cal-dica-lista";

    grupo.contas.forEach(function(conta) {
        const linha = document.createElement("li");
        const ponto = document.createElement("span");
        const textos = document.createElement("span");
        const nome = document.createElement("strong");
        const situacao = document.createElement("small");
        const valor = document.createElement("span");

        ponto.className = "vc-ponto " + (conta.paga ? "venc-pago" : "venc-pendente");
        textos.className = "cal-dica-textos";
        nome.textContent = nomeDoVencimento(conta);
        situacao.textContent = `${conta.parcela ? "Cartão" : "Recorrente"} · ${conta.paga ? "Paga" : "Pendente"}`;
        valor.className = "cal-dica-valor sensivel";
        valor.textContent = formatarMoeda(Number(conta.valor) || 0);

        textos.appendChild(nome);
        textos.appendChild(situacao);
        linha.appendChild(ponto);
        linha.appendChild(textos);
        linha.appendChild(valor);
        lista.appendChild(linha);
    });

    dica.appendChild(titulo);
    dica.appendChild(lista);

    if (grupo.contas.length > 1) {
        const total = document.createElement("div");
        const rotulo = document.createElement("span");
        const valorTotal = document.createElement("strong");

        total.className = "cal-dica-total";
        rotulo.textContent = "Total do dia";
        valorTotal.className = "sensivel";
        valorTotal.textContent = formatarMoeda(grupo.total);
        total.appendChild(rotulo);
        total.appendChild(valorTotal);
        dica.appendChild(total);
    }

    document.body.appendChild(dica);

    // Posição: acima do dia (ou abaixo, se não couber), sempre dentro da tela
    const caixa = celula.getBoundingClientRect();
    const largura = dica.offsetWidth;
    const altura = dica.offsetHeight;
    const margem = 8;
    let esquerda = caixa.left + caixa.width / 2 - largura / 2;

    esquerda = Math.max(margem, Math.min(esquerda, window.innerWidth - largura - margem));

    let topo = caixa.top - altura - 8;

    if (topo < margem) {
        topo = caixa.bottom + 8;
    }

    dica.style.left = `${esquerda}px`;
    dica.style.top = `${topo}px`;

    celula.classList.add("cal-ativa");
    dicaCalendario = dica;
    celulaDaDica = celula;
}

document.addEventListener("pointerdown", function(evento) {
    if (celulaDaDica && !celulaDaDica.contains(evento.target)) {
        esconderDicaCalendario();
    }
});

window.addEventListener("scroll", esconderDicaCalendario, true);

// Calendário do mês, com os vencimentos nos dias
function montarCalendario(mes, grupos) {
    esconderDicaCalendario();
    calendarioVencimentos.innerHTML = "";

    const ano = Number(mes.slice(0, 4));
    const mesNumero = Number(mes.slice(5, 7));
    const primeiroDia = new Date(ano, mesNumero - 1, 1).getDay();
    const diasNoMes = new Date(ano, mesNumero, 0).getDate();

    ["D", "S", "T", "Q", "Q", "S", "S"].forEach(function(letra) {
        const cabecalho = document.createElement("span");
        cabecalho.className = "cal-semana";
        cabecalho.textContent = letra;
        calendarioVencimentos.appendChild(cabecalho);
    });

    for (let i = 0; i < primeiroDia; i++) {
        calendarioVencimentos.appendChild(document.createElement("span"));
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const data = `${mes}-${String(dia).padStart(2, "0")}`;
        const grupo = grupos.find(function(item) { return item.data === data; });

        const celula = document.createElement("div");
        celula.className = "cal-dia" + (grupo ? " cal-tem" : "") + (data === dataDeHoje() ? " cal-hoje" : "");

        const numero = document.createElement("span");
        numero.className = "cal-numero";
        numero.textContent = dia;
        celula.appendChild(numero);

        if (grupo) {
            const status = statusDoGrupo(grupo);
            const resumo = document.createElement("span");
            const nome = document.createElement("span");
            const marca = document.createElement("span");

            // Nome da conta (ou quantas contas) e o valor do dia
            resumo.className = "cal-resumo";
            nome.className = "cal-nome";
            nome.textContent = grupo.contas.length > 1
                ? `${grupo.contas.length} Contas`
                : nomeDoVencimento(grupo.contas[0]);
            marca.className = "cal-valor sensivel " + status.classe;
            marca.textContent = formatarMoeda(grupo.total).replace("R$", "").trim();

            resumo.appendChild(nome);
            resumo.appendChild(marca);
            celula.appendChild(resumo);

            celula.tabIndex = 0;
            celula.setAttribute("role", "button");
            celula.setAttribute("aria-label", `${dia}: ${grupo.nome}, ${formatarMoeda(grupo.total)}`);

            celula.addEventListener("mouseenter", function() { mostrarDicaCalendario(celula, grupo); });
            celula.addEventListener("mouseleave", esconderDicaCalendario);
            celula.addEventListener("focus", function() { mostrarDicaCalendario(celula, grupo); });
            celula.addEventListener("blur", esconderDicaCalendario);
            celula.addEventListener("click", function() {
                if (celulaDaDica === celula) {
                    esconderDicaCalendario();
                } else {
                    mostrarDicaCalendario(celula, grupo);
                }
            });
        }

        calendarioVencimentos.appendChild(celula);
    }
}

botaoCalendario.addEventListener("click", function() {
    calendarioVencimentos.hidden = !calendarioVencimentos.hidden;
    botaoCalendario.setAttribute("aria-expanded", String(!calendarioVencimentos.hidden));
    botaoCalendario.textContent = calendarioVencimentos.hidden ? "Expandir calendário" : "Recolher calendário";
});

// 25.2 Cotação de moedas e criptomoedas
const MOEDAS = [
    { cod: "BRL", nome: "Real", tipo: "fiat" },
    { cod: "USD", nome: "Dólar", tipo: "fiat" },
    { cod: "EUR", nome: "Euro", tipo: "fiat" },
    { cod: "GBP", nome: "Libra", tipo: "fiat" },
    { cod: "JPY", nome: "Iene", tipo: "fiat" },
    { cod: "BTC", nome: "Bitcoin", tipo: "cripto", id: "bitcoin" },
    { cod: "ETH", nome: "Ethereum", tipo: "cripto", id: "ethereum" },
    { cod: "SOL", nome: "Solana", tipo: "cripto", id: "solana" },
    { cod: "BNB", nome: "BNB", tipo: "cripto", id: "binancecoin" }
];

const cotBase = document.getElementById("cot-base");
const cotAlvo = document.getElementById("cot-alvo");
const cotValor = document.getElementById("cot-valor");
const cotResultado = document.getElementById("cot-resultado");
const cotTaxa = document.getElementById("cot-taxa");
const cotSaldo = document.getElementById("cot-saldo");
const cotSaldoRotulo = document.getElementById("cot-saldo-rotulo");
const cotStatus = document.getElementById("cot-status");
const cotVariacao = document.getElementById("cot-variacao");

function moedaPorCodigo(codigo) {
    return MOEDAS.find(function(moeda) { return moeda.cod === codigo; });
}

// Quanto vale 1 unidade da moeda, em dólares (null se ainda não há cotação)
function valorEmDolar(codigo) {
    const tabela = (cacheApi.moedas || {}).usd || {};

    return tabela[codigo] > 0 ? tabela[codigo] : null;
}

async function atualizarCotacaoMoedas(forcar) {
    const atual = cacheApi.moedas || {};

    if (!forcar && atual.atualizadoEm && Date.now() - atual.atualizadoEm < 10 * 60 * 1000) {
        return;
    }

    const ids = MOEDAS.filter(function(moeda) { return moeda.tipo === "cripto"; })
        .map(function(moeda) { return moeda.id; }).join(",");

    const resultados = await Promise.allSettled([
        buscarJSON("https://open.er-api.com/v6/latest/USD"),
        buscarJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
    ]);

    const novo = {
        usd: Object.assign({ USD: 1 }, atual.usd),
        variacao: Object.assign({}, atual.variacao),
        anterior: atual.anterior,
        dia: atual.dia,
        atualizadoEm: atual.atualizadoEm
    };

    // Guarda o dia anterior para calcular a variação das moedas comuns
    if (novo.dia && novo.dia !== dataDeHoje()) {
        novo.anterior = { dia: novo.dia, usd: Object.assign({}, novo.usd) };
    }

    let algumaOk = false;

    if (resultados[0].status === "fulfilled" && resultados[0].value && resultados[0].value.rates) {
        const taxas = resultados[0].value.rates;

        MOEDAS.filter(function(moeda) { return moeda.tipo === "fiat"; }).forEach(function(moeda) {
            if (taxas[moeda.cod] > 0) {
                novo.usd[moeda.cod] = 1 / taxas[moeda.cod];
            }
        });

        algumaOk = true;
    }

    if (resultados[1].status === "fulfilled" && resultados[1].value) {
        MOEDAS.filter(function(moeda) { return moeda.tipo === "cripto"; }).forEach(function(moeda) {
            const dados = resultados[1].value[moeda.id];

            if (dados && dados.usd > 0) {
                novo.usd[moeda.cod] = dados.usd;
                novo.variacao[moeda.cod] = Number(dados.usd_24h_change) || 0;
            }
        });

        algumaOk = true;
    }

    cacheApi.erroMoedas = !algumaOk;

    if (algumaOk) {
        novo.dia = dataDeHoje();
        novo.atualizadoEm = Date.now();
        cacheApi.moedas = novo;
    }
}

// Variação do dia de uma moeda em relação ao dólar (%)
function variacaoDaMoeda(codigo) {
    const moedas = cacheApi.moedas || {};

    if (moedas.variacao && moedas.variacao[codigo] != null) {
        return moedas.variacao[codigo];
    }

    const anterior = moedas.anterior && moedas.anterior.usd && moedas.anterior.usd[codigo];
    const atual = valorEmDolar(codigo);

    return anterior > 0 && atual > 0 ? (atual / anterior - 1) * 100 : 0;
}

function formatarQuantia(valor, moeda) {
    if (moeda.tipo === "fiat") {
        return valor.toLocaleString("pt-BR", { style: "currency", currency: moeda.cod, maximumFractionDigits: valor < 1 ? 4 : 2 });
    }

    return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 8 })} ${moeda.cod}`;
}

function formatarTaxaMoeda(valor) {
    return valor.toLocaleString("pt-BR", { maximumFractionDigits: valor < 1 ? 6 : 2 });
}

function atualizarCotacaoTela() {
    const base = moedaPorCodigo(cotBase.value);
    const alvo = moedaPorCodigo(cotAlvo.value);
    const usdBase = valorEmDolar(base.cod);
    const usdAlvo = valorEmDolar(alvo.cod);
    const moedas = cacheApi.moedas || {};

    cotSaldoRotulo.textContent = `Seu saldo total em ${alvo.cod}:`;

    if (!usdBase || !usdAlvo) {
        cotResultado.textContent = "—";
        cotTaxa.textContent = "";
        cotSaldo.textContent = "—";
        cotVariacao.hidden = true;
        cotStatus.textContent = cacheApi.erroMoedas
            ? "Sem conexão com as APIs de cotação."
            : "Carregando cotações…";
        return;
    }

    const taxa = usdBase / usdAlvo;
    const quantidade = Number(cotValor.value);

    cotResultado.textContent = Number.isFinite(quantidade)
        ? formatarQuantia(quantidade * taxa, alvo)
        : "—";

    cotTaxa.textContent = `1 ${base.cod} = ${formatarTaxaMoeda(taxa)} ${alvo.cod}  ·  1 ${alvo.cod} = ${formatarTaxaMoeda(1 / taxa)} ${base.cod}`;

    // Saldo total do app (em reais) na moeda alvo
    const usdReal = valorEmDolar("BRL");

    cotSaldo.textContent = usdReal
        ? formatarQuantia(calcularSaldoAcumulado() * usdReal / usdAlvo, alvo)
        : "—";

    // Variação da cotação (base em relação à moeda alvo)
    const variacao = ((1 + variacaoDaMoeda(base.cod) / 100) / (1 + variacaoDaMoeda(alvo.cod) / 100) - 1) * 100;

    cotVariacao.hidden = !Number.isFinite(variacao) || Math.abs(variacao) < 0.005;
    cotVariacao.textContent = `${variacao >= 0 ? "+" : ""}${variacao.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
    cotVariacao.className = "selo-variacao " + (variacao >= 0 ? "variacao-alta" : "variacao-baixa");

    cotStatus.textContent = cacheApi.erroMoedas
        ? `Sem conexão: última cotação salva às ${horaCurta(moedas.atualizadoEm)}.`
        : `Atualizado às ${horaCurta(moedas.atualizadoEm)}`;
}

function montarSeletoresMoeda() {
    let preferencias = {};

    try {
        preferencias = JSON.parse(localStorage.getItem("cotacaoPreferencias")) || {};
    } catch (erro) {
        preferencias = {};
    }

    [cotBase, cotAlvo].forEach(function(seletor) {
        const moedasComuns = document.createElement("optgroup");
        const criptos = document.createElement("optgroup");

        moedasComuns.label = "Moedas";
        criptos.label = "Criptomoedas";

        MOEDAS.forEach(function(moeda) {
            const opcao = document.createElement("option");

            opcao.value = moeda.cod;
            opcao.textContent = `${moeda.cod} (${moeda.nome})`;
            (moeda.tipo === "fiat" ? moedasComuns : criptos).appendChild(opcao);
        });

        seletor.appendChild(moedasComuns);
        seletor.appendChild(criptos);
    });

    cotBase.value = moedaPorCodigo(preferencias.base) ? preferencias.base : "BRL";
    cotAlvo.value = moedaPorCodigo(preferencias.alvo) ? preferencias.alvo : "USD";

    if (Number(preferencias.valor) >= 0 && preferencias.valor !== undefined) {
        cotValor.value = preferencias.valor;
    }
}

function salvarPreferenciasCotacao() {
    try {
        localStorage.setItem("cotacaoPreferencias", JSON.stringify({
            base: cotBase.value,
            alvo: cotAlvo.value,
            valor: cotValor.value
        }));
    } catch (erro) {
        // Sem armazenamento: apenas não lembra da escolha
    }
}

[cotBase, cotAlvo, cotValor].forEach(function(campo) {
    campo.addEventListener(campo === cotValor ? "input" : "change", function() {
        salvarPreferenciasCotacao();
        atualizarCotacaoTela();
    });
});

document.getElementById("cot-atualizar").addEventListener("click", function() {
    atualizarTudoApis(true);
});

montarSeletoresMoeda();



// ==========================================================
// 26. Cadastro de despesa: tipo de pagamento (avulsa, recorrente, cartão parcelado)
// ==========================================================
const camposParcelas = document.getElementById("campos-parcelas");
const numParcelas = document.getElementById("num-parcelas");
const valorParcela = document.getElementById("valor-parcela");
const rotuloValorDespesa = document.getElementById("rotulo-valor");
const rotuloDataDespesa = document.getElementById("rotulo-data");

function tipoPagamentoAtual() {
    return document.querySelector('input[name="tipo-pagamento"]:checked').value;
}

// "12x de R$ 416,67 / mês"
function atualizarValorParcela() {
    const total = Number(campoValor.value);
    const parcelas = Math.floor(Number(numParcelas.value));

    if (total > 0 && parcelas >= 2) {
        valorParcela.textContent = `${parcelas}x de ${formatarMoeda(total / parcelas)} / mês`;
    } else {
        valorParcela.textContent = "—";
    }
}

function aplicarTipoPagamento() {
    const tipo = tipoPagamentoAtual();

    // A recorrência usa a lógica que já existia (frequência e dia do vencimento)
    despesaRecorrente.checked = tipo === "recorrente";
    despesaRecorrente.dispatchEvent(new Event("change"));

    camposParcelas.hidden = tipo !== "parcelado";
    numParcelas.required = tipo === "parcelado";

    rotuloValorDespesa.textContent = tipo === "parcelado" ? "Valor total da compra" : "Valor";
    rotuloDataDespesa.textContent = tipo === "parcelado" ? "Data da 1ª parcela" : "Data do gasto";

    atualizarValorParcela();
}

document.querySelectorAll('input[name="tipo-pagamento"]').forEach(function(opcao) {
    opcao.addEventListener("change", aplicarTipoPagamento);
});

numParcelas.addEventListener("input", atualizarValorParcela);
campoValor.addEventListener("input", atualizarValorParcela);

// Soma meses a uma data AAAA-MM-DD (dia 31 + 1 mês cai no último dia do mês seguinte)
function adicionarMeses(dataISO, quantidade) {
    const partes = dataISO.split("-").map(Number);
    const alvo = new Date(partes[0], partes[1] - 1 + quantidade, 1);
    const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();

    return `${alvo.getFullYear()}-` +
        `${String(alvo.getMonth() + 1).padStart(2, "0")}-` +
        `${String(Math.min(partes[2], ultimoDia)).padStart(2, "0")}`;
}

// Cria uma despesa para cada parcela (a última ajusta os centavos)
function cadastrarCompraParcelada(descricao, valorTotal, data, categoria, totalParcelas) {
    const idCompra = Date.now();
    const centavosTotal = Math.round(valorTotal * 100);
    const centavosParcela = Math.floor(centavosTotal / totalParcelas);

    for (let numero = 1; numero <= totalParcelas; numero++) {
        const centavos = numero === totalParcelas
            ? centavosTotal - centavosParcela * (totalParcelas - 1)
            : centavosParcela;

        gastos.push({
            id: `${idCompra}-${numero}`,
            idCompra: idCompra,
            parcela: { numero: numero, total: totalParcelas },
            modeloRecorrencia: false,
            descricao: descricao,
            valor: centavos / 100,
            data: adicionarMeses(data, numero - 1),
            categoria: categoria,
            paga: false,
            recorrente: false
        });
    }
}

// Título de uma despesa: parcelas mostram "Nome (4× 2/4)" sem gravar isso na descrição
function tituloDaDespesa(despesa) {
    return despesa.parcela
        ? `${despesa.descricao} (${despesa.parcela.total}× ${despesa.parcela.numero}/${despesa.parcela.total})`
        : despesa.descricao;
}



// ==========================================================
// 27. Seletor de datas minimalista (substitui os campos de data e de mês)
// ==========================================================
const NOMES_MESES_SELETOR = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
const SIGLAS_MESES_SELETOR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_SEMANA_SELETOR = ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sá"];

// Anos disponíveis: do ano em que a pessoa começou a usar o site até 20 anos à frente do ano atual
function limitesDeAnoSeletor(valorAtual) {
    const anoAtual = new Date().getFullYear();
    let inicio = anoAtual;

    try {
        const salvo = Number(localStorage.getItem("anoInicioUso"));

        if (Number.isInteger(salvo) && salvo >= 2000 && salvo <= anoAtual) {
            inicio = salvo;
        } else {
            localStorage.setItem("anoInicioUso", String(anoAtual));
        }
    } catch (erro) {
        // Sem armazenamento: usa o ano atual como começo
    }

    // Um valor já salvo mais antigo continua aparecendo
    if (valorAtual && valorAtual.ano < inicio) {
        inicio = valorAtual.ano;
    }

    return { inicio: inicio, fim: anoAtual + 20 };
}

const ICONE_CALENDARIO_SELETOR =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/>' +
    '<path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>';
const ICONE_SETA_ESQUERDA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const ICONE_SETA_DIREITA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
const ICONE_SETA_BAIXO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

const descricaoValorOriginal = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");

// Seletor atualmente aberto (só existe um por vez)
let seletorAberto = null;
let janelaSeletor = null;

function doisDigitos(numero) {
    return String(numero).padStart(2, "0");
}

// "2026-11-02" -> { ano, mes, dia }  |  "2026-11" -> { ano, mes }
function lerValorSeletor(valor, ehMes) {
    const modelo = ehMes ? /^(\d{4})-(\d{2})$/ : /^(\d{4})-(\d{2})-(\d{2})$/;
    const partes = modelo.exec(valor || "");

    if (!partes) {
        return null;
    }

    return { ano: Number(partes[1]), mes: Number(partes[2]) - 1, dia: Number(partes[3] || 1) };
}

function textoDoSeletor(valor, ehMes) {
    const dados = lerValorSeletor(valor, ehMes);

    if (!dados) {
        return "";
    }

    return ehMes
        ? `${NOMES_MESES_SELETOR[dados.mes]} de ${dados.ano}`
        : `${doisDigitos(dados.dia)}/${doisDigitos(dados.mes + 1)}/${dados.ano}`;
}

function criarElementoSeletor(tag, classe, html) {
    const elemento = document.createElement(tag);

    elemento.className = classe;

    if (html) {
        elemento.innerHTML = html;
    }

    return elemento;
}

// Transforma um campo de data/mês em botão + calendário (o campo original continua guardando o valor)
function melhorarCampoDeData(campo) {
    const ehMes = campo.type === "month";
    const envoltorio = criarElementoSeletor("div", "dp");
    const botao = criarElementoSeletor("button", "dp-botao");
    const texto = criarElementoSeletor("span", "dp-texto");

    botao.type = "button";
    botao.innerHTML = ICONE_CALENDARIO_SELETOR;
    botao.appendChild(texto);

    campo.parentNode.insertBefore(envoltorio, campo);
    envoltorio.appendChild(campo);
    envoltorio.appendChild(botao);

    campo.classList.add("dp-nativo");
    campo.tabIndex = -1;

    function atualizarTexto() {
        const formatado = textoDoSeletor(campo.value, ehMes);

        texto.textContent = formatado || (ehMes ? "Selecionar mês" : "Selecionar data");
        texto.classList.toggle("dp-vazio", !formatado);
    }

    // O JavaScript do app troca o valor do campo; o botão acompanha
    Object.defineProperty(campo, "value", {
        configurable: true,
        get: function() {
            return descricaoValorOriginal.get.call(campo);
        },
        set: function(novoValor) {
            descricaoValorOriginal.set.call(campo, novoValor);
            atualizarTexto();
        }
    });

    if (campo.form) {
        campo.form.addEventListener("reset", function() {
            setTimeout(atualizarTexto, 0);
        });
    }

    document.querySelectorAll(`label[for="${campo.id}"]`).forEach(function(rotulo) {
        rotulo.addEventListener("click", function(evento) {
            evento.preventDefault();
            botao.click();
        });
    });

    botao.addEventListener("click", function() {
        if (seletorAberto && seletorAberto.campo === campo) {
            fecharSeletor();
            return;
        }

        abrirSeletor(campo, botao, ehMes);
    });

    campo.addEventListener("invalid", function() {
        botao.classList.add("dp-invalido");
    });

    atualizarTexto();
}

function fecharSeletor() {
    if (janelaSeletor) {
        janelaSeletor.remove();
        janelaSeletor = null;
    }

    if (seletorAberto) {
        seletorAberto.botao.setAttribute("aria-expanded", "false");
        seletorAberto = null;
    }
}

function posicionarSeletor() {
    if (!seletorAberto || !janelaSeletor) {
        return;
    }

    const caixa = seletorAberto.botao.getBoundingClientRect();
    const largura = janelaSeletor.offsetWidth;
    const altura = janelaSeletor.offsetHeight;
    const margem = 8;

    let esquerda = Math.min(caixa.left, window.innerWidth - largura - margem);
    esquerda = Math.max(margem, esquerda);

    let topo = caixa.bottom + 6;

    if (topo + altura > window.innerHeight - margem && caixa.top - altura - 6 > margem) {
        topo = caixa.top - altura - 6;
    }

    janelaSeletor.style.left = `${esquerda}px`;
    janelaSeletor.style.top = `${Math.max(margem, topo)}px`;
}

function abrirSeletor(campo, botao, ehMes) {
    fecharSeletor();
    fecharSelecao();

    const atual = lerValorSeletor(campo.value, ehMes);
    const hoje = new Date();

    const estado = {
        campo: campo,
        botao: botao,
        ehMes: ehMes,
        // "dias" (calendário) ou "meses" (ano + mês)
        visao: ehMes ? "meses" : "dias",
        ano: atual ? atual.ano : hoje.getFullYear(),
        mes: atual ? atual.mes : hoje.getMonth()
    };

    seletorAberto = estado;
    janelaSeletor = criarElementoSeletor("div", "dp-janela");
    janelaSeletor.setAttribute("role", "dialog");
    janelaSeletor.setAttribute("aria-label", ehMes ? "Escolher mês" : "Escolher data");
    botao.setAttribute("aria-expanded", "true");
    document.body.appendChild(janelaSeletor);

    desenharSeletor();
}

function escolherNoSeletor(valor) {
    const estado = seletorAberto;

    if (!estado) {
        return;
    }

    estado.campo.value = valor;
    estado.botao.classList.remove("dp-invalido");
    estado.campo.dispatchEvent(new Event("input", { bubbles: true }));
    estado.campo.dispatchEvent(new Event("change", { bubbles: true }));

    fecharSeletor();
}

function desenharSeletor() {
    const estado = seletorAberto;

    if (!estado || !janelaSeletor) {
        return;
    }

    const atual = lerValorSeletor(estado.campo.value, estado.ehMes);
    const limites = limitesDeAnoSeletor(atual);
    const hoje = new Date();
    const janela = janelaSeletor;

    janela.innerHTML = "";

    // Cabeçalho: setas e título (o título troca entre calendário e ano/mês)
    const cabecalho = criarElementoSeletor("div", "dp-cabecalho");
    const titulo = criarElementoSeletor("button", "dp-titulo");
    titulo.type = "button";

    if (estado.visao === "dias") {
        const anterior = criarElementoSeletor("button", "dp-seta", ICONE_SETA_ESQUERDA);
        const proximo = criarElementoSeletor("button", "dp-seta", ICONE_SETA_DIREITA);

        anterior.type = "button";
        proximo.type = "button";
        anterior.setAttribute("aria-label", "Mês anterior");
        proximo.setAttribute("aria-label", "Próximo mês");

        anterior.disabled = estado.ano <= limites.inicio && estado.mes === 0;
        proximo.disabled = estado.ano >= limites.fim && estado.mes === 11;

        function mudarMes(delta) {
            const novo = new Date(estado.ano, estado.mes + delta, 1);

            estado.ano = novo.getFullYear();
            estado.mes = novo.getMonth();
            desenharSeletor();
        }

        anterior.addEventListener("click", function() { mudarMes(-1); });
        proximo.addEventListener("click", function() { mudarMes(1); });

        titulo.textContent = `${NOMES_MESES_SELETOR[estado.mes]} ${estado.ano}`;
        titulo.addEventListener("click", function() {
            estado.visao = "meses";
            desenharSeletor();
        });

        cabecalho.appendChild(anterior);
        cabecalho.appendChild(titulo);
        cabecalho.appendChild(proximo);
        janela.appendChild(cabecalho);

        const semana = criarElementoSeletor("div", "dp-semana");

        DIAS_SEMANA_SELETOR.forEach(function(sigla) {
            semana.appendChild(criarElementoSeletor("span", "dp-sigla", sigla));
        });

        janela.appendChild(semana);

        const grade = criarElementoSeletor("div", "dp-dias");
        const primeiroDia = new Date(estado.ano, estado.mes, 1).getDay();
        const totalDias = new Date(estado.ano, estado.mes + 1, 0).getDate();

        for (let i = 0; i < primeiroDia; i++) {
            grade.appendChild(criarElementoSeletor("span", "dp-vazio-dia"));
        }

        for (let dia = 1; dia <= totalDias; dia++) {
            const botaoDia = criarElementoSeletor("button", "dp-dia", String(dia));
            botaoDia.type = "button";

            if (atual && atual.ano === estado.ano && atual.mes === estado.mes && atual.dia === dia) {
                botaoDia.classList.add("dp-escolhido");
            }

            if (hoje.getFullYear() === estado.ano && hoje.getMonth() === estado.mes && hoje.getDate() === dia) {
                botaoDia.classList.add("dp-hoje");
            }

            botaoDia.addEventListener("click", function() {
                escolherNoSeletor(`${estado.ano}-${doisDigitos(estado.mes + 1)}-${doisDigitos(dia)}`);
            });

            grade.appendChild(botaoDia);
        }

        janela.appendChild(grade);
    } else {
        titulo.innerHTML = `<span>${NOMES_MESES_SELETOR[estado.mes]} de ${estado.ano}</span>${ICONE_SETA_BAIXO}`;
        titulo.classList.add("dp-titulo-aberto");

        // Em um campo de data, tocar no título volta para o calendário
        if (!estado.ehMes) {
            titulo.addEventListener("click", function() {
                estado.visao = "dias";
                desenharSeletor();
            });
        } else {
            titulo.disabled = true;
        }

        cabecalho.appendChild(titulo);
        janela.appendChild(cabecalho);

        const listaAnos = criarElementoSeletor("div", "dp-anos");

        for (let ano = limites.inicio; ano <= limites.fim; ano++) {
            const botaoAno = criarElementoSeletor("button", "dp-ano", String(ano));
            botaoAno.type = "button";

            if (ano === estado.ano) {
                botaoAno.classList.add("dp-escolhido");
            }

            botaoAno.addEventListener("click", function() {
                estado.ano = ano;
                desenharSeletor();
            });

            listaAnos.appendChild(botaoAno);
        }

        suavizarRolagem(listaAnos);
        janela.appendChild(listaAnos);

        const gradeMeses = criarElementoSeletor("div", "dp-meses");

        SIGLAS_MESES_SELETOR.forEach(function(sigla, indice) {
            const botaoMes = criarElementoSeletor("button", "dp-mes", sigla);
            botaoMes.type = "button";

            if (atual && atual.ano === estado.ano && atual.mes === indice) {
                botaoMes.classList.add("dp-escolhido");
            } else if (hoje.getFullYear() === estado.ano && hoje.getMonth() === indice) {
                botaoMes.classList.add("dp-hoje");
            }

            botaoMes.addEventListener("click", function() {
                if (estado.ehMes) {
                    escolherNoSeletor(`${estado.ano}-${doisDigitos(indice + 1)}`);
                } else {
                    estado.mes = indice;
                    estado.visao = "dias";
                    desenharSeletor();
                }
            });

            gradeMeses.appendChild(botaoMes);
        });

        janela.appendChild(gradeMeses);

        // Deixa o ano escolhido visível na lista
        const escolhido = listaAnos.querySelector(".dp-escolhido");

        if (escolhido) {
            listaAnos.scrollTop = Math.max(0, escolhido.offsetTop - listaAnos.offsetTop - 2);
        }
    }

    // Rodapé: atalho para hoje e (se o campo não for obrigatório) limpar
    const rodape = criarElementoSeletor("div", "dp-rodape");
    const atalhoHoje = criarElementoSeletor("button", "dp-atalho", estado.ehMes ? "Este mês" : "Hoje");
    atalhoHoje.type = "button";

    atalhoHoje.addEventListener("click", function() {
        escolherNoSeletor(estado.ehMes
            ? `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}`
            : `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`);
    });

    rodape.appendChild(atalhoHoje);

    if (!estado.campo.required) {
        const limpar = criarElementoSeletor("button", "dp-atalho dp-atalho-limpar", "Limpar");
        limpar.type = "button";

        limpar.addEventListener("click", function() {
            escolherNoSeletor("");
        });

        rodape.appendChild(limpar);
    }

    janela.appendChild(rodape);

    posicionarSeletor();
}

document.addEventListener("pointerdown", function(evento) {
    if (!seletorAberto) {
        return;
    }

    if (janelaSeletor && janelaSeletor.contains(evento.target)) {
        return;
    }

    if (seletorAberto.botao.contains(evento.target)) {
        return;
    }

    fecharSeletor();
});

document.addEventListener("keydown", function(evento) {
    if (evento.key === "Escape" && seletorAberto) {
        const botao = seletorAberto.botao;

        fecharSeletor();
        botao.focus();
    }
});

window.addEventListener("resize", posicionarSeletor);
window.addEventListener("scroll", posicionarSeletor, true);

document.querySelectorAll('input[type="date"], input[type="month"]').forEach(melhorarCampoDeData);

// ==========================================================
// 27.1 Listas de opções estilizadas (substituem a lista padrão dos campos de seleção)
// ==========================================================
const ICONE_SETA_SELECT = '<svg class="cs-seta" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

// Campos de seleção que mostram um ícone de calendário (períodos)
const SELECTS_COM_CALENDARIO = ["comp-ano", "comp-comparar"];

let listaAberta = null;
let janelaLista = null;

function fecharSelecao() {
    if (janelaLista) {
        janelaLista.remove();
        janelaLista = null;
    }

    if (listaAberta) {
        listaAberta.botao.setAttribute("aria-expanded", "false");
        listaAberta = null;
    }
}

// Rolagem mais suave com a roda do mouse (um item por vez)
function suavizarRolagem(elemento) {
    elemento.addEventListener("wheel", function(evento) {
        if (elemento.scrollHeight <= elemento.clientHeight) {
            return;
        }

        evento.preventDefault();
        elemento.scrollTop += Math.sign(evento.deltaY) * Math.min(Math.abs(evento.deltaY), 36);
    }, { passive: false });
}

function posicionarLista() {
    if (!listaAberta || !janelaLista) {
        return;
    }

    const caixa = listaAberta.botao.getBoundingClientRect();
    const margem = 8;
    const larguraMinima = listaAberta.plano ? 210 : 160;
    const largura = Math.min(Math.max(caixa.width, larguraMinima), window.innerWidth - margem * 2);

    const rolagem = janelaLista.scrollTop;

    janelaLista.style.width = `${largura}px`;
    janelaLista.style.maxHeight = "none";

    const alturaTotal = janelaLista.scrollHeight + 2;
    const abaixo = window.innerHeight - caixa.bottom - margem - 6;
    const acima = caixa.top - margem - 6;
    const emCima = alturaTotal > abaixo && acima > abaixo;
    const espaco = Math.max(120, Math.min(300, emCima ? acima : abaixo));
    const altura = Math.min(alturaTotal, espaco);

    janelaLista.style.maxHeight = `${espaco}px`;
    janelaLista.scrollTop = rolagem;

    let esquerda = Math.min(caixa.left, window.innerWidth - largura - margem);
    esquerda = Math.max(margem, esquerda);

    janelaLista.style.left = `${esquerda}px`;
    janelaLista.style.top = `${emCima ? caixa.top - altura - 6 : caixa.bottom + 6}px`;
}

function desenharLista(focarEscolhida) {
    const estado = listaAberta;

    if (!estado || !janelaLista) {
        return;
    }

    const select = estado.select;
    const janela = janelaLista;

    janela.innerHTML = "";

    function criarItem(opcao) {
        const item = criarElementoSeletor("button", "cs-item");

        item.type = "button";
        item.setAttribute("role", "option");
        item.textContent = opcao.textContent;
        item.disabled = opcao.disabled;

        const escolhido = opcao.value === select.value && select.selectedIndex >= 0 && opcao === select.options[select.selectedIndex];

        if (escolhido) {
            item.classList.add("cs-escolhido");
            item.setAttribute("aria-selected", "true");
        }

        item.addEventListener("click", function() {
            select.value = opcao.value;
            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));

            const botao = estado.botao;

            fecharSelecao();
            botao.focus();
        });

        return item;
    }

    Array.from(select.children).forEach(function(filho) {
        if (filho.tagName === "OPTGROUP") {
            janela.appendChild(criarElementoSeletor("div", "cs-grupo", filho.label));

            Array.from(filho.children).forEach(function(opcao) {
                janela.appendChild(criarItem(opcao));
            });
        } else if (filho.tagName === "OPTION") {
            janela.appendChild(criarItem(filho));
        }
    });

    posicionarLista();

    // Com o mouse a lista começa pelo topo; pelo teclado, já mostra a opção atual
    janela.scrollTop = 0;

    if (focarEscolhida) {
        const alvo = janela.querySelector(".cs-escolhido") || janela.querySelector(".cs-item:not(:disabled)");

        if (alvo) {
            alvo.focus();
        }
    }
}

function abrirLista(select, botao, plano, focarEscolhida) {
    fecharSelecao();
    fecharSeletor();

    listaAberta = { select: select, botao: botao, plano: plano };
    janelaLista = criarElementoSeletor("div", "cs-janela");
    janelaLista.setAttribute("role", "listbox");
    botao.setAttribute("aria-expanded", "true");
    document.body.appendChild(janelaLista);

    suavizarRolagem(janelaLista);

    janelaLista.addEventListener("keydown", function(evento) {
        const itens = Array.from(janelaLista.querySelectorAll(".cs-item:not(:disabled)"));
        const posicao = itens.indexOf(document.activeElement);

        if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
            evento.preventDefault();

            const proximo = evento.key === "ArrowDown"
                ? Math.min(posicao + 1, itens.length - 1)
                : Math.max(posicao - 1, 0);

            itens[proximo].focus();
        } else if (evento.key === "Home" || evento.key === "End") {
            evento.preventDefault();
            itens[evento.key === "Home" ? 0 : itens.length - 1].focus();
        } else if (evento.key === "Tab") {
            fecharSelecao();
        }
    });

    desenharLista(focarEscolhida);
}

function melhorarSelect(select) {
    const envoltorio = criarElementoSeletor("div", "cs");
    const botao = criarElementoSeletor("button", "cs-botao");
    const texto = criarElementoSeletor("span", "cs-texto");
    const plano = Boolean(select.closest(".seletor-mes, .sim-mes-box"));

    if (plano) {
        envoltorio.classList.add("cs-plano");
    } else if (select.classList.contains("select-ano")) {
        envoltorio.classList.add("cs-compacto");
    }

    botao.type = "button";
    botao.setAttribute("aria-haspopup", "listbox");
    botao.setAttribute("aria-expanded", "false");

    if (select.getAttribute("aria-label")) {
        botao.setAttribute("aria-label", select.getAttribute("aria-label"));
    }

    if (SELECTS_COM_CALENDARIO.includes(select.id)) {
        botao.innerHTML = ICONE_CALENDARIO_SELETOR;
    }

    botao.appendChild(texto);
    botao.insertAdjacentHTML("beforeend", ICONE_SETA_SELECT);

    select.parentNode.insertBefore(envoltorio, select);
    envoltorio.appendChild(select);
    envoltorio.appendChild(botao);

    select.classList.add("cs-nativo");
    select.tabIndex = -1;

    function atualizarTexto() {
        const opcao = select.options[select.selectedIndex];

        texto.textContent = opcao ? opcao.textContent : "";
        texto.classList.toggle("dp-vazio", Boolean(opcao) && opcao.value === "");
        botao.disabled = select.disabled;
    }

    Object.defineProperty(select, "value", {
        configurable: true,
        get: function() {
            return descricaoValorSelect.get.call(select);
        },
        set: function(novoValor) {
            descricaoValorSelect.set.call(select, novoValor);
            atualizarTexto();

            if (listaAberta && listaAberta.select === select) {
                desenharLista(false);
            }
        }
    });

    new MutationObserver(function() {
        atualizarTexto();

        if (listaAberta && listaAberta.select === select) {
            desenharLista(false);
        }
    }).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });

    select.addEventListener("change", atualizarTexto);

    if (select.form) {
        select.form.addEventListener("reset", function() {
            setTimeout(atualizarTexto, 0);
        });
    }

    document.querySelectorAll(`label[for="${select.id}"]`).forEach(function(rotulo) {
        rotulo.addEventListener("click", function(evento) {
            if (botao.contains(evento.target)) {
                return;
            }

            evento.preventDefault();
            botao.click();
        });
    });

    // .seletor-mes é um rótulo que envolve o campo
    const rotuloPai = select.closest("label");

    if (rotuloPai) {
        rotuloPai.addEventListener("click", function(evento) {
            if (!botao.contains(evento.target)) {
                evento.preventDefault();
                botao.click();
            }
        });
    }

    botao.addEventListener("click", function() {
        if (listaAberta && listaAberta.select === select) {
            fecharSelecao();
            return;
        }

        abrirLista(select, botao, plano, false);
    });

    botao.addEventListener("keydown", function(evento) {
        if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
            evento.preventDefault();
            abrirLista(select, botao, plano, true);
        }
    });

    select.addEventListener("invalid", function() {
        botao.classList.add("dp-invalido");
    });

    atualizarTexto();
}

const descricaoValorSelect = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");

document.addEventListener("pointerdown", function(evento) {
    if (!listaAberta) {
        return;
    }

    if ((janelaLista && janelaLista.contains(evento.target)) || listaAberta.botao.contains(evento.target)) {
        return;
    }

    fecharSelecao();
});

document.addEventListener("keydown", function(evento) {
    if (evento.key === "Escape" && listaAberta) {
        const botao = listaAberta.botao;

        fecharSelecao();
        botao.focus();
    }
});

window.addEventListener("resize", posicionarLista);
window.addEventListener("scroll", function(evento) {
    if (janelaLista && evento.target instanceof Node && janelaLista.contains(evento.target)) {
        return;
    }

    posicionarLista();
}, true);

document.querySelectorAll("select").forEach(melhorarSelect);



// ==========================================================
// 28. Janelas de aviso, confirmação e pergunta (no estilo do site)
// ==========================================================
const ICONES_DIALOGO = {
    pergunta: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    perigo: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    aviso: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    erro: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    sucesso: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    receita: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    despesa: '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>',
    pausar: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    retomar: '<polygon points="6 3 20 12 6 21 6 3"/>',
    editar: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
    meta: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    restaurar: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'
};

const filaDialogos = [];
let dialogoAberto = false;

// Escolhe o tipo do aviso pelo texto (sucesso, erro ou atenção)
function tipoDoAviso(mensagem) {
    if (/sucesso/i.test(mensagem)) {
        return "sucesso";
    }

    if (/não foi possível|não é um backup|erro/i.test(mensagem)) {
        return "erro";
    }

    return "aviso";
}

const TITULOS_AVISO = { sucesso: "Tudo certo!", erro: "Algo deu errado", aviso: "Atenção" };

// Substitui o alert(): mostra um aviso com o botão "Entendi"
function mostrarAviso(mensagem, tipo) {
    const tipoFinal = tipo || tipoDoAviso(String(mensagem));

    return abrirDialogo({
        icone: tipoFinal,
        tom: tipoFinal,
        titulo: TITULOS_AVISO[tipoFinal],
        mensagem: String(mensagem),
        textoConfirmar: "Entendi",
        textoCancelar: null
    }).then(function() {
        return undefined;
    });
}

// Substitui o confirm(): devolve true ou false
function confirmar(opcoes) {
    return abrirDialogo({
        icone: opcoes.icone || (opcoes.perigo ? "perigo" : "pergunta"),
        tom: opcoes.perigo ? "perigo" : (opcoes.tom || "pergunta"),
        titulo: opcoes.titulo,
        mensagem: opcoes.mensagem,
        textoConfirmar: opcoes.textoConfirmar || "Confirmar",
        textoCancelar: opcoes.textoCancelar || "Cancelar",
        perigo: Boolean(opcoes.perigo)
    }).then(function(resultado) {
        return Boolean(resultado);
    });
}

// Substitui o prompt() com um campo: devolve o texto ou null
function perguntar(opcoes) {
    return abrirDialogo({
        icone: opcoes.icone || "editar",
        tom: "pergunta",
        titulo: opcoes.titulo,
        mensagem: opcoes.mensagem,
        textoConfirmar: opcoes.textoConfirmar || "Salvar",
        textoCancelar: "Cancelar",
        campos: [{
            id: "resposta",
            rotulo: opcoes.rotulo || "",
            tipo: opcoes.tipo || "decimal",
            valor: opcoes.valor === undefined || opcoes.valor === null ? "" : String(opcoes.valor),
            placeholder: opcoes.placeholder || ""
        }]
    }).then(function(resultado) {
        return resultado ? resultado.resposta : null;
    });
}

// Janela com vários campos: devolve um objeto com os valores ou null
function abrirFormulario(opcoes) {
    return abrirDialogo({
        icone: opcoes.icone || "editar",
        tom: "pergunta",
        titulo: opcoes.titulo,
        mensagem: opcoes.mensagem,
        textoConfirmar: opcoes.textoConfirmar || "Salvar",
        textoCancelar: "Cancelar",
        campos: opcoes.campos,
        validar: opcoes.validar
    });
}

function abrirDialogo(configuracao) {
    return new Promise(function(resolver) {
        filaDialogos.push({ configuracao: configuracao, resolver: resolver });
        mostrarProximoDialogo();
    });
}

function mostrarProximoDialogo() {
    if (dialogoAberto || filaDialogos.length === 0) {
        return;
    }

    const item = filaDialogos.shift();
    const config = item.configuracao;
    const anterior = document.activeElement;

    dialogoAberto = true;

    const fundo = criarElementoSeletor("div", "dialogo-fundo");
    const caixa = criarElementoSeletor("div", "dialogo");
    const topo = criarElementoSeletor("div", "dialogo-topo");
    const icone = criarElementoSeletor("div", `dialogo-icone tom-${config.tom || "pergunta"}`);
    const textos = criarElementoSeletor("div", "dialogo-textos");
    const titulo = criarElementoSeletor("h3", "dialogo-titulo");
    const formulario = criarElementoSeletor("form", "dialogo-campos");
    const erro = criarElementoSeletor("p", "dialogo-erro");
    const acoes = criarElementoSeletor("div", "dialogo-acoes");

    caixa.setAttribute("role", config.textoCancelar === null ? "alertdialog" : "dialog");
    caixa.setAttribute("aria-modal", "true");
    caixa.setAttribute("aria-labelledby", "dialogo-titulo-texto");

    icone.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES_DIALOGO[config.icone] || ICONES_DIALOGO.pergunta}</svg>`;

    titulo.id = "dialogo-titulo-texto";
    titulo.textContent = config.titulo || "";
    textos.appendChild(titulo);

    if (config.mensagem) {
        const mensagem = criarElementoSeletor("p", "dialogo-mensagem");

        mensagem.textContent = config.mensagem;
        textos.appendChild(mensagem);
    }

    topo.appendChild(icone);
    topo.appendChild(textos);
    caixa.appendChild(topo);

    if (config.classe) {
        caixa.classList.add(config.classe);
    }

    if (config.corpo) {
        caixa.appendChild(config.corpo);
    }

    // Campos (para perguntas e edições)
    const camposCriados = {};

    (config.campos || []).forEach(function(campo) {
        const idCampo = `dialogo-campo-${campo.id}`;
        let elemento;

        if (campo.rotulo) {
            const rotulo = criarElementoSeletor("label", "");

            rotulo.htmlFor = idCampo;
            rotulo.textContent = campo.rotulo;
            formulario.appendChild(rotulo);
        }

        if (campo.tipo === "select") {
            elemento = document.createElement("select");

            campo.opcoes.forEach(function(opcao) {
                const item = document.createElement("option");

                item.value = opcao;
                item.textContent = opcao;
                elemento.appendChild(item);
            });

            elemento.value = campo.valor;
        } else {
            elemento = document.createElement("input");
            elemento.type = campo.tipo === "date" ? "date" : "text";
            elemento.required = campo.tipo === "date";

            if (campo.tipo === "decimal") {
                elemento.inputMode = "decimal";
            }

            elemento.value = campo.valor || "";
            elemento.placeholder = campo.placeholder || "";
            elemento.autocomplete = "off";
        }

        elemento.id = idCampo;
        formulario.appendChild(elemento);
        camposCriados[campo.id] = elemento;
    });

    if ((config.campos || []).length > 0) {
        formulario.appendChild(erro);
        caixa.appendChild(formulario);
    }

    const botaoCancelar = criarElementoSeletor("button", "dialogo-botao dialogo-cancelar", config.textoCancelar || "");
    const botaoConfirmar = criarElementoSeletor("button", "dialogo-botao dialogo-confirmar" + (config.perigo ? " perigo" : ""), config.textoConfirmar || "OK");

    botaoCancelar.type = "button";
    botaoConfirmar.type = "button";

    if (config.textoCancelar !== null) {
        acoes.appendChild(botaoCancelar);
    }

    acoes.appendChild(botaoConfirmar);
    caixa.appendChild(acoes);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    document.body.classList.add("dialogo-ativo");

    // Os campos de data e de seleção ganham o mesmo visual do restante do site
    Object.keys(camposCriados).forEach(function(chave) {
        const elemento = camposCriados[chave];

        if (elemento.tagName === "SELECT") {
            melhorarSelect(elemento);
        } else if (elemento.type === "date") {
            melhorarCampoDeData(elemento);
        }
    });

    function coletar() {
        const valores = {};

        Object.keys(camposCriados).forEach(function(chave) {
            valores[chave] = camposCriados[chave].value;
        });

        return valores;
    }

    function fechar(resultado) {
        fecharSeletor();
        fecharSelecao();
        document.removeEventListener("keydown", aoTeclar, true);
        fundo.remove();
        document.body.classList.remove("dialogo-ativo");
        dialogoAberto = false;

        if (anterior && typeof anterior.focus === "function" && document.contains(anterior)) {
            anterior.focus();
        }

        item.resolver(resultado);
        mostrarProximoDialogo();
    }

    function confirmarDialogo() {
        if ((config.campos || []).length === 0) {
            fechar(true);
            return;
        }

        const valores = coletar();
        const mensagemErro = config.validar ? config.validar(valores) : null;

        if (mensagemErro) {
            erro.textContent = mensagemErro;
            erro.classList.add("visivel");
            return;
        }

        fechar(valores);
    }

    function cancelarDialogo() {
        fechar(config.textoCancelar === null ? true : ((config.campos || []).length > 0 ? null : false));
    }

    function aoTeclar(evento) {
        // Se um calendário ou lista estiver aberto, o Esc fecha só ele
        if (evento.key === "Escape") {
            if (seletorAberto || listaAberta) {
                return;
            }

            evento.preventDefault();
            cancelarDialogo();
            return;
        }

        if (evento.key === "Tab") {
            const focaveis = Array.from(caixa.querySelectorAll("button:not(:disabled), input:not(.dp-nativo), select:not(.cs-nativo)"))
                .filter(function(elemento) { return elemento.offsetParent !== null; });

            if (focaveis.length === 0) {
                return;
            }

            const primeiro = focaveis[0];
            const ultimo = focaveis[focaveis.length - 1];

            if (evento.shiftKey && document.activeElement === primeiro) {
                evento.preventDefault();
                ultimo.focus();
            } else if (!evento.shiftKey && document.activeElement === ultimo) {
                evento.preventDefault();
                primeiro.focus();
            }
        }
    }

    botaoConfirmar.addEventListener("click", confirmarDialogo);
    botaoCancelar.addEventListener("click", cancelarDialogo);

    formulario.addEventListener("submit", function(evento) {
        evento.preventDefault();
        confirmarDialogo();
    });

    formulario.addEventListener("keydown", function(evento) {
        if (evento.key === "Enter" && evento.target.tagName === "INPUT" && !evento.target.classList.contains("dp-nativo")) {
            evento.preventDefault();
            confirmarDialogo();
        }
    });

    fundo.addEventListener("pointerdown", function(evento) {
        if (evento.target === fundo) {
            cancelarDialogo();
        }
    });

    document.addEventListener("keydown", aoTeclar, true);

    // Foco inicial: no primeiro campo; em ações perigosas, no "Cancelar" (mais seguro)
    const primeiroCampo = formulario.querySelector("input:not(.dp-nativo), select:not(.cs-nativo)");

    if (primeiroCampo && primeiroCampo.type !== "date") {
        primeiroCampo.focus();

        if (typeof primeiroCampo.select === "function") {
            primeiroCampo.select();
        }
    } else if (config.perigo && config.textoCancelar !== null) {
        botaoCancelar.focus();
    } else {
        botaoConfirmar.focus();
    }
}


// ==========================================================
// 29. Pausar e retomar despesas recorrentes
// ==========================================================

// Todas as ocorrências de uma recorrência (mensal, semanal...) têm a mesma chave
function chaveDaSerie(despesa) {
    return despesa.idRecorrencia || despesa.id;
}

// Despesas pausadas ou "puladas" não entram em somas, saldo, orçamento nem vencimentos
function despesaAtiva(despesa) {
    return !despesa.pausada && !despesa.pulada;
}

function serieDaDespesa(despesa) {
    const chave = chaveDaSerie(despesa);

    return gastos.filter(function(item) {
        return item.recorrente && chaveDaSerie(item) === chave;
    });
}

function serieEstaPausada(despesa) {
    return serieDaDespesa(despesa).some(function(item) {
        return item.pausada;
    });
}

function atualizarTelasDeDespesas() {
    localStorage.setItem("gastos", JSON.stringify(gastos));

    atualizarHistorico();
    atualizarResumoMensal();
    atualizarSaldo();
    atualizarPainel();
}

async function alternarPausaRecorrencia(despesa) {
    const serie = serieDaDespesa(despesa);
    const nome = despesa.descricao;

    if (despesa.pausada) {
        const retomar = await confirmar({
            icone: "retomar",
            tom: "sucesso",
            titulo: "Retomar despesa?",
            mensagem: `"${nome}" volta a contar nas suas despesas.\n\nOs meses anteriores em que ficou pausada continuam de fora.`,
            textoConfirmar: "Retomar"
        });

        if (!retomar) {
            return;
        }

        serie.forEach(function(item) {
            if (item.pausada) {
                delete item.pausada;

                // Meses que já passaram durante a pausa ficam de fora para sempre
                if (item.data.slice(0, 7) < mesAtual) {
                    item.pulada = true;
                }
            }
        });

        atualizarTelasDeDespesas();
        return;
    }

    // A pausa vale para o que ainda está pendente, do mês atual em diante
    const inicio = `${mesAtual}-01`;
    const alvo = serie.filter(function(item) {
        return !item.pulada && !item.paga && item.data >= inicio;
    });

    if (alvo.length === 0) {
        mostrarAviso("Não há ocorrências pendentes desta despesa para pausar.");
        return;
    }

    // Mostra o efeito no mês atual antes de confirmar
    const doMesAtual = alvo.filter(function(item) {
        return item.data.startsWith(mesAtual);
    });
    const descontoMes = doMesAtual.reduce(function(soma, item) {
        return soma + (Number(item.valor) || 0);
    }, 0);
    let efeito = "";

    if (descontoMes > 0) {
        const totalAtual = somarDespesasDoMes(mesAtual);

        efeito = `Este mês: -${formatarMoeda(descontoMes)} (suas despesas passam de ${formatarMoeda(totalAtual)} para ${formatarMoeda(totalAtual - descontoMes)}).`;

        efeito += "\n\n";
    }

    const pausar = await confirmar({
        icone: "pausar",
        tom: "pergunta",
        titulo: "Pausar despesa recorrente?",
        mensagem: `Deseja pausar "${nome}"?\n\n${efeito}Enquanto estiver pausada, ela não conta nas despesas, no saldo nem nos vencimentos. Você pode retomar quando quiser.`,
        textoConfirmar: "Pausar"
    });

    if (!pausar) {
        return;
    }

    alvo.forEach(function(item) {
        item.pausada = true;
    });

    atualizarTelasDeDespesas();
}


// ==========================================================
// 30. Detalhes de receitas e despesas do mês (ao clicar nos cartões do Início)
// ==========================================================
const ICONE_SETA_DIREITA_CARTAO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
const ICONE_RECEITA_DETALHE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>';
const ICONE_DESPESA_DETALHE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>';

function criarLinhaDetalhe(opcoes) {
    const linha = document.createElement("li");
    const icone = document.createElement("span");
    const textos = document.createElement("span");
    const titulo = document.createElement("span");
    const nome = document.createElement("strong");
    const meta = document.createElement("small");
    const valor = document.createElement("span");

    linha.className = "detalhe-item" + (opcoes.apagado ? " detalhe-apagado" : "");
    icone.className = `detalhe-icone ${opcoes.tom}`;
    icone.innerHTML = opcoes.icone;
    textos.className = "detalhe-textos";
    titulo.className = "detalhe-titulo";
    nome.textContent = opcoes.nome;
    titulo.appendChild(nome);

    (opcoes.selos || []).forEach(function(selo) {
        const elemento = document.createElement("span");

        elemento.className = `detalhe-selo ${selo.classe}`;
        elemento.textContent = selo.texto;
        titulo.appendChild(elemento);
    });

    meta.textContent = opcoes.meta || "";
    valor.className = `detalhe-valor sensivel ${opcoes.tomValor}`;
    valor.textContent = opcoes.valor;

    textos.appendChild(titulo);

    if (opcoes.meta) {
        textos.appendChild(meta);
    }

    linha.appendChild(icone);
    linha.appendChild(textos);
    linha.appendChild(valor);

    return linha;
}

function criarCorpoDetalhes(linhas, rotuloTotal, total, vazio) {
    const corpo = document.createElement("div");

    corpo.className = "detalhe-corpo";

    if (linhas.length === 0) {
        const aviso = document.createElement("p");

        aviso.className = "detalhe-vazio";
        aviso.textContent = vazio;
        corpo.appendChild(aviso);

        return corpo;
    }

    const lista = document.createElement("ul");
    const rodape = document.createElement("div");
    const rotulo = document.createElement("span");
    const valor = document.createElement("strong");

    lista.className = "detalhe-lista";
    linhas.forEach(function(linha) { lista.appendChild(linha); });

    rodape.className = "detalhe-total";
    rotulo.textContent = rotuloTotal;
    valor.className = "sensivel";
    valor.textContent = formatarMoeda(total);
    rodape.appendChild(rotulo);
    rodape.appendChild(valor);

    corpo.appendChild(lista);
    corpo.appendChild(rodape);

    return corpo;
}

function abrirDetalhesDoMes(tipo) {
    const mes = filtroMes.value;

    if (!mes) {
        mostrarAviso("Selecione um mês para ver os detalhes.");
        return;
    }

    if (tipo === "receitas") {
        const receita = receitas.find(function(item) { return item.mes === mes; });
        const linhas = [];
        let somaLancamentos = 0;

        if (receita) {
            lancamentosDaReceita(receita).forEach(function(lancamento) {
                const valor = Number(lancamento.valor) || 0;

                somaLancamentos += valor;

                linhas.push(criarLinhaDetalhe({
                    icone: ICONE_RECEITA_DETALHE,
                    tom: "tom-receita",
                    nome: lancamento.descricao || "Receita",
                    meta: lancamento.registradoEm
                        ? `Lançada em ${new Date(lancamento.registradoEm).toLocaleDateString("pt-BR")}`
                        : "",
                    valor: formatarMoeda(valor),
                    tomValor: "valor-receita"
                }));
            });

            // Quando o saldo do mês foi ajustado, mostra a diferença
            const diferenca = Number(receita.valor) - somaLancamentos;

            if (Math.abs(diferenca) >= 0.005) {
                linhas.push(criarLinhaDetalhe({
                    icone: ICONE_RECEITA_DETALHE,
                    tom: "tom-receita",
                    nome: "Ajuste de saldo",
                    meta: "Correção feita no valor do mês",
                    valor: formatarComSinal(diferenca),
                    tomValor: "valor-receita"
                }));
            }
        }

        abrirDialogo({
            icone: "receita",
            tom: "sucesso",
            titulo: "Receitas do mês",
            mensagem: nomeDoMes(mes),
            corpo: criarCorpoDetalhes(linhas, "Total de receitas", receita ? Number(receita.valor) : 0, "Nenhuma receita registrada neste mês."),
            classe: "dialogo-largo",
            textoConfirmar: "Fechar",
            textoCancelar: null
        });

        return;
    }

    const doMes = gastos
        .filter(function(despesa) {
            return typeof despesa.data === "string" && despesa.data.startsWith(mes);
        })
        .sort(function(a, b) {
            return String(a.data).localeCompare(String(b.data));
        });

    // Pausadas aparecem apagadas no fim e não entram no total
    const ordenadas = doMes.filter(despesaAtiva).concat(doMes.filter(function(despesa) { return !despesaAtiva(despesa); }));
    const linhas = ordenadas.map(function(despesa) {
        const selos = [];
        const partesMeta = [formatarDataBR(despesa.data).slice(0, 5), despesa.categoria || "Sem categoria"];

        if (despesa.parcela) {
            selos.push({ classe: "selo-cartao", texto: `Cartão ${despesa.parcela.numero}/${despesa.parcela.total}` });
            partesMeta.push(`${despesa.parcela.total}× de ${formatarMoeda(Number(despesa.valor) || 0)}`);
        } else if (despesa.recorrente) {
            selos.push({ classe: "selo-recorrente", texto: "Recorrente" });
        }

        if (!despesaAtiva(despesa)) {
            selos.push({ classe: despesa.pausada ? "selo-pausada" : "selo-pulada", texto: despesa.pausada ? "Pausada" : "Pulada" });
        } else if (despesa.recorrente || despesa.parcela) {
            selos.push({ classe: despesa.paga ? "selo-paga" : "selo-pendente", texto: despesa.paga ? "Paga" : "Pendente" });
        }

        return criarLinhaDetalhe({
            icone: ICONE_DESPESA_DETALHE,
            tom: "tom-despesa",
            nome: despesa.descricao,
            selos: selos,
            meta: partesMeta.join(" · "),
            valor: formatarMoeda(Number(despesa.valor) || 0),
            tomValor: "valor-despesa",
            apagado: !despesaAtiva(despesa)
        });
    });

    abrirDialogo({
        icone: "despesa",
        tom: "pergunta",
        titulo: "Despesas do mês",
        mensagem: nomeDoMes(mes),
        corpo: criarCorpoDetalhes(linhas, "Total de despesas", somarDespesasDoMes(mes), "Nenhuma despesa registrada neste mês."),
        classe: "dialogo-largo",
        textoConfirmar: "Fechar",
        textoCancelar: null
    });
}

// Os cartões "Receitas do mês" e "Despesas do mês" viram botões
[[totalReceita, "receitas", "Ver receitas do mês"], [totalDespesa, "despesas", "Ver despesas do mês"]].forEach(function(item) {
    const cartao = item[0].closest(".card-resumo");
    const seta = document.createElement("span");

    cartao.classList.add("card-clicavel");
    cartao.tabIndex = 0;
    cartao.setAttribute("role", "button");
    cartao.setAttribute("aria-label", item[2]);
    cartao.title = item[2];

    seta.className = "card-seta";
    seta.innerHTML = ICONE_SETA_DIREITA_CARTAO;
    cartao.appendChild(seta);

    cartao.addEventListener("click", function() {
        abrirDetalhesDoMes(item[1]);
    });

    cartao.addEventListener("keydown", function(evento) {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            abrirDetalhesDoMes(item[1]);
        }
    });
});


// ==========================================================
// 21. Início do aplicativo
// ==========================================================

// 21.1 Lembrar as preferências (tema e valores ocultos)
try {
    if (localStorage.getItem("tema") === "claro") {
        document.body.classList.add("modo-claro");
        document.querySelectorAll(".texto-tema").forEach(function(texto) {
            texto.textContent = "Modo escuro";
        });
    }

    aplicarVisibilidadeValores(localStorage.getItem("ocultarValores") === "1");
} catch (erro) {
    // Sem armazenamento: usa o padrão
}

// 21.2 Atualizar a exibição inicial
mostrarGastos(gastos);
mostrarMetas(metas);
mostrarInvestimentos();
atualizarCategorias();
atualizarOpcoesMetas();
carregarReceitaDoMes();
atualizarHistorico();
atualizarResumoMensal();
atualizarOpcoesInvestimentos();
atualizarSaldo();
atualizarCamposApi();
atualizarResumoReserva();
aplicarTipoPagamento();
atualizarVencimentos();
atualizarCotacaoTela();
atualizarStatusApis();

// 21.3 Menus e seção inicial
construirMenus();

// Easter egg: chuva de notinhas ao CLICAR no emoji de dinheiro (cabeçalho da lateral)
(function () {
    const cifrao = document.querySelector(".menu-marca-cifrao");
    const marca = document.querySelector(".menu-marca");
    if (!cifrao || !marca) return;
    let intervalo = null;
    let limite = null;

    function soltarNota() {
        const caixaMarca = marca.getBoundingClientRect();
        const caixaEmoji = cifrao.getBoundingClientRect();
        const topo = caixaEmoji.top - caixaMarca.top + 4;
        // A nota cai só até antes da divisória (não passa do texto "Painel")
        const queda = Math.max(12, caixaMarca.height - topo - 22);
        const nota = document.createElement("span");
        nota.className = "nota-chuva";
        nota.textContent = Math.random() < 0.75 ? "💵" : "💸";
        nota.style.left = (caixaEmoji.left - caixaMarca.left + Math.random() * 14 - 4) + "px";
        nota.style.top = topo + "px";
        nota.style.setProperty("--desvio", (Math.random() * 44 - 22) + "px");
        nota.style.setProperty("--giro", (Math.random() * 120 - 60) + "deg");
        nota.style.setProperty("--queda", queda + "px");
        nota.addEventListener("animationend", () => nota.remove());
        marca.appendChild(nota);
    }

    function parar() {
        clearInterval(intervalo);
        clearTimeout(limite);
        intervalo = null;
        cifrao.classList.remove("ativo");
        marca.querySelectorAll(".nota-chuva").forEach(n => {
            n.classList.add("sumindo");
            setTimeout(() => n.remove(), 220);
        });
    }

    function iniciar() {
        if (intervalo) return;
        cifrao.classList.add("ativo");
        soltarNota();
        intervalo = setInterval(soltarNota, 420);
        // No celular não existe "tirar o mouse": para sozinho depois de 3 segundos
        if (!window.matchMedia("(hover: hover)").matches) {
            limite = setTimeout(parar, 3000);
        }
    }

    // Só começa com um clique; para ao tirar o mouse de cima do emoji
    cifrao.addEventListener("click", iniciar);
    cifrao.addEventListener("mouseleave", parar);
    // Segurança: se o mouse sair do cabeçalho por qualquer motivo, para também
    marca.addEventListener("mouseleave", parar);
    window.addEventListener("blur", parar);
})();

// ==========================================================
// 22. Sobre, mascote e tutorial de boas-vindas
// ==========================================================

// 22.1 Versão e histórico de atualizações
// A cada atualização do app, adicione um item NO TOPO desta lista (ex.: "1.1").
// A versão mostrada no site é sempre a do primeiro item.
const CHANGELOG = [
    {
        versao: "1.0",
        data: "03/11/2026",
        titulo: "Lançamento",
        itens: [
            "Início com saldo, receitas e despesas do mês, vencimentos e cotação de moedas",
            "Despesas avulsas, recorrentes e parceladas no cartão, com pausa de recorrências",
            "Receitas por mês com histórico de lançamentos e ajuste de saldo",
            "Metas, Reserva e Investimentos com cotações e simulador por período",
            "Relatórios e Comparativo de períodos com gráficos",
            "Backup e restauração dos dados, modo claro e escuro e ocultar valores",
            "Novo: tutorial de boas-vindas com o mascote Bufunfa, painel Sobre e envio de feedback"
        ]
    }
];

const VERSAO_APP = CHANGELOG[0].versao;

// Feedback: as mensagens chegam em um canal do seu Discord.
// Cole aqui o link do webhook do canal (Discord > Editar canal > Integrações > Webhooks > Copiar URL).
// Enquanto estiver vazio, o formulário avisa que ainda não foi configurado.
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1567312389039329410/1i4FVekQxoJJq0W6-YQlsk7hyIbnq-cIVmO9BHrUuT37GMUsA3NB_7O6i3N9_NvGr7no";

// 22.2 Mascote Bufunfa: leão-marinho de cartola e gravata borboleta (SVG animado)
// poses: acenar, apontar, moeda, sentado
function criarMascote(pose) {
    return `
<svg class="mascote m-${pose}" viewBox="-12 -12 184 214" aria-hidden="true">
    <ellipse cx="80" cy="191" rx="50" ry="6" fill="rgba(0,0,0,.35)"/>
    <ellipse cx="40" cy="183" rx="32" ry="6" transform="rotate(-8 40 183)" fill="#4f4336"/>
    <ellipse cx="120" cy="183" rx="32" ry="6" transform="rotate(8 120 183)" fill="#4f4336"/>
    <g class="m-corpo">
        <path d="M52 80 Q38 132 46 177 Q80 192 114 177 Q122 132 108 80 Z" fill="#6a5c4b"/>
        <ellipse cx="80" cy="136" rx="27" ry="42" fill="#a99371"/>
        <ellipse cx="80" cy="128" rx="19" ry="30" fill="#bda684" opacity=".55"/>
    </g>
    <g class="m-braco-e" style="transform-origin:54px 100px">
        <path d="M54 98 Q34 112 38 152 Q41 165 50 160 Q60 132 64 108 Z" fill="#5a4d3e"/>
    </g>
    <g class="m-braco-d" style="transform-origin:106px 100px">
        <path d="M106 98 Q126 112 122 152 Q119 165 110 160 Q100 132 96 108 Z" fill="#5a4d3e"/>
        <g class="m-tablet" transform="rotate(14 118 160)">
            <rect x="106" y="140" width="28" height="36" rx="3" fill="#d4dae3" stroke="#8c95a3" stroke-width="1.5"/>
            <rect x="109.5" y="143.5" width="21" height="27" rx="1.5" fill="#1d3b5c"/>
            <path d="M113 165 l5 -6 l4 3 l6 -8" fill="none" stroke="#F0B93B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <g class="m-moeda">
            <circle cx="117" cy="162" r="11" fill="#F0B93B" stroke="#b9860f" stroke-width="2"/>
            <path d="M111 167 l4 -5 l3 3 l5 -7" fill="none" stroke="#7a5608" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
    </g>
    <g class="m-cabeca" style="transform-origin:80px 92px">
        <ellipse cx="49" cy="60" rx="5" ry="7" fill="#5a4d3e"/>
        <ellipse cx="111" cy="60" rx="5" ry="7" fill="#5a4d3e"/>
        <ellipse cx="80" cy="64" rx="28" ry="30" fill="#6a5c4b"/>
        <ellipse cx="80" cy="78" rx="15" ry="14" fill="#8d7b64"/>
        <ellipse cx="80" cy="71" rx="6.5" ry="4.6" fill="#1d2024"/>
        <path class="m-boca" d="M80 75 v5" stroke="#2a2825" stroke-width="2" stroke-linecap="round"/>
        <path class="m-boca" d="M72 86 Q80 81 88 86" fill="none" stroke="#2a2825" stroke-width="2.2" stroke-linecap="round"/>
        <g class="m-sorriso">
            <path d="M80 75 v4" stroke="#2a2825" stroke-width="2" stroke-linecap="round"/>
            <path d="M70 83 Q80 95 90 83 Q80 88 70 83 Z" fill="#2a2825" stroke="#2a2825" stroke-width="2" stroke-linejoin="round"/>
            <path d="M74 86 Q80 90 86 86" fill="none" stroke="#f4efe6" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="55" cy="72" rx="5" ry="3" fill="#e0866f" opacity=".55"/>
            <ellipse cx="105" cy="72" rx="5" ry="3" fill="#e0866f" opacity=".55"/>
        </g>
        <g stroke="#e4dccd" stroke-width="1" stroke-linecap="round" opacity=".8">
            <path d="M64 74 L44 70"/><path d="M64 77 L43 78"/><path d="M65 80 L47 86"/>
            <path d="M96 74 L116 70"/><path d="M96 77 L117 78"/><path d="M95 80 L113 86"/>
        </g>
        <g class="m-olhos" style="transform-origin:80px 56px">
            <ellipse cx="66" cy="56" rx="4.4" ry="4.8" fill="#16181b"/>
            <ellipse cx="94" cy="56" rx="4.4" ry="4.8" fill="#16181b"/>
            <circle cx="67.4" cy="54.5" r="1.4" fill="#fff"/><circle cx="95.4" cy="54.5" r="1.4" fill="#fff"/>
        </g>
        <path class="m-sobr" d="M59 52 Q66 47 73 52" fill="none" stroke="#2a2825" stroke-width="2.4" stroke-linecap="round"/>
        <path class="m-sobr" d="M87 52 Q94 47 101 52" fill="none" stroke="#2a2825" stroke-width="2.4" stroke-linecap="round"/>
        <g class="m-oculos">
            <path d="M52 53 L58 53 M102 53 L108 53" stroke="#0c0d10" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M58 49 H76 a2 2 0 0 1 2 2 v4 a8 8 0 0 1 -8 8 h-4 a8 8 0 0 1 -8 -8 v-4 a2 2 0 0 1 2 -2 Z" fill="#0c0d10"/>
            <path d="M82 49 H100 a2 2 0 0 1 2 2 v4 a8 8 0 0 1 -8 8 h-4 a8 8 0 0 1 -8 -8 v-4 a2 2 0 0 1 2 -2 Z" fill="#0c0d10"/>
            <path d="M78 52 Q80 50.5 82 52" fill="none" stroke="#0c0d10" stroke-width="2.4"/>
            <path d="M61 52 l5 -0.5 M85 52 l5 -0.5" stroke="#F0B93B" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>
            <path d="M63 56 l3 -.3 M87 56 l3 -.3" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
        </g>
        <ellipse cx="80" cy="40" rx="42" ry="9" fill="#0f1114"/>
        <rect x="54" y="6" width="52" height="34" rx="4" fill="#15181c"/>
        <ellipse cx="80" cy="7" rx="26" ry="5.5" fill="#20242a"/>
        <rect x="54" y="29" width="52" height="7" fill="#c8322f"/>
        <text x="80" y="24" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="7.6" textLength="42" lengthAdjust="spacingAndGlyphs" fill="#F0B93B">BUFUNFA</text>
        <path d="M95 13 l4 -4 l3 3 l5 -6" fill="none" stroke="#F0B93B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g class="m-gravata">
        <path d="M80 100 L61 91 L61 109 Z" fill="#101215"/>
        <path d="M80 100 L99 91 L99 109 Z" fill="#101215"/>
        <rect x="75" y="94" width="10" height="12" rx="3" fill="#1b1e23"/>
    </g>
    <g class="m-malabarismo">
        <g class="m-mo m-mo1"><circle r="9" fill="#F0B93B" stroke="#b9860f" stroke-width="2"/><path d="M-4 3 l3 -4 l2.5 2.5 l4 -5" fill="none" stroke="#7a5608" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g class="m-mo m-mo2"><circle r="9" fill="#F0B93B" stroke="#b9860f" stroke-width="2"/><path d="M-4 3 l3 -4 l2.5 2.5 l4 -5" fill="none" stroke="#7a5608" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g class="m-mo m-mo3"><circle r="9" fill="#F0B93B" stroke="#b9860f" stroke-width="2"/><path d="M-4 3 l3 -4 l2.5 2.5 l4 -5" fill="none" stroke="#7a5608" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g>
    </g>
</svg>`;
}

// Coloca o mascote em todo elemento marcado com data-mascote="pose"
document.querySelectorAll("[data-mascote]").forEach(function(el) {
    el.innerHTML = criarMascote(el.dataset.mascote);
});

// Confetes: soltos a partir de um ponto da tela (x, y em pixels)
// opcoes: direcao (graus, -90 = para cima), abertura (graus) e potencia
function soltarConfetes(x, y, quantidade, opcoes) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const config = Object.assign({ direcao: -90, abertura: 80, potencia: 1 }, opcoes || {});
    const cores = ["#F0B93B", "#34D399", "#FB7185", "#8B7CF6", "#60A5FA", "#F4F4F5"];
    const camada = document.createElement("div");
    let maiorDuracao = 0;

    camada.className = "confetes";
    document.body.appendChild(camada);

    for (let i = 0; i < quantidade; i++) {
        const el = document.createElement("i");
        const angulo = (config.direcao + (Math.random() - 0.5) * config.abertura) * Math.PI / 180;
        const forca = (240 + Math.random() * 380) * config.potencia;
        const dx = Math.cos(angulo) * forca;
        const dy = Math.sin(angulo) * forca;
        const queda = 280 + Math.random() * 360;
        const giro = (Math.random() - 0.5) * 1080;
        const duracao = 1500 + Math.random() * 1100;

        maiorDuracao = Math.max(maiorDuracao, duracao);
        el.className = "confete" + (Math.random() < 0.3 ? " redondo" : "");
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.backgroundColor = cores[i % cores.length];

        el.animate([
            { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
            { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) rotate(${giro * 0.4}deg)`, opacity: 1, offset: 0.35 },
            { transform: `translate(${dx}px, ${dy + queda}px) rotate(${giro}deg)`, opacity: 0 }
        ], {
            duration: duracao,
            easing: "cubic-bezier(0.2, 0.7, 0.4, 1)",
            fill: "forwards"
        });

        camada.appendChild(el);
    }

    setTimeout(function() {
        camada.remove();
    }, maiorDuracao + 100);
}

// Fim do modo feliz: espera o fim do ciclo do pulinho (sem tranco), volta à pose suavemente e solta confetes
function encerrarFeliz(mascote) {
    if (!mascote.classList.contains("m-feliz") || mascote.classList.contains("m-saindo")) {
        return;
    }

    function iniciarSaida() {
        const caixa = mascote.getBoundingClientRect();

        mascote.removeEventListener("animationiteration", aoCicloCompleto);
        clearTimeout(mascote.temporizadorEspera);
        mascote.classList.add("m-saindo");
        soltarConfetes(caixa.left + caixa.width / 2, caixa.top + caixa.height * 0.3, 36, { direcao: -90, abertura: 110 });

        mascote.temporizadorSaida = setTimeout(function() {
            mascote.classList.remove("m-feliz", "m-saindo");
        }, 480);
    }

    function aoCicloCompleto(evento) {
        if (evento.target === mascote && evento.animationName === "m-pulinho") {
            iniciarSaida();
        }
    }

    mascote.cancelarEspera = function() {
        mascote.removeEventListener("animationiteration", aoCicloCompleto);
        clearTimeout(mascote.temporizadorEspera);
    };

    mascote.addEventListener("animationiteration", aoCicloCompleto);
    mascote.temporizadorEspera = setTimeout(iniciarSaida, 900);
}

// Clique no mascote: ele fica feliz, de óculos escuros, e faz malabarismo com moedinhas
document.addEventListener("click", function(evento) {
    const mascote = evento.target.closest(".mascote");

    if (!mascote) {
        return;
    }

    if (mascote.cancelarEspera) {
        mascote.cancelarEspera();
    }

    clearTimeout(mascote.temporizadorSaida);
    mascote.classList.remove("m-saindo");
    mascote.classList.add("m-feliz");
    clearTimeout(mascote.temporizadorFeliz);
    mascote.temporizadorFeliz = setTimeout(function() {
        encerrarFeliz(mascote);
    }, 6000);
});

// 22.3 Painel Sobre: versão, atalhos, histórico, glossário e feedback
document.querySelectorAll("[data-versao-texto]").forEach(function(el) {
    el.textContent = "Versão " + VERSAO_APP;
});

(function montarChangelog() {
    const lista = document.getElementById("lista-changelog");

    CHANGELOG.forEach(function(versao, indice) {
        const bloco = document.createElement("div");
        bloco.className = "sb-versao" + (indice === 0 ? " atual" : "");

        const topo = document.createElement("div");
        topo.className = "sb-versao-topo";
        topo.innerHTML = `<strong>v${versao.versao}</strong><span>${versao.titulo}</span><small>${versao.data}</small>`;

        const itens = document.createElement("ul");
        versao.itens.forEach(function(texto) {
            const li = document.createElement("li");
            li.textContent = texto;
            itens.appendChild(li);
        });

        bloco.appendChild(topo);
        bloco.appendChild(itens);
        lista.appendChild(bloco);
    });
})();

document.addEventListener("click", function(evento) {
    const botao = evento.target.closest("[data-rolar]");

    if (!botao) {
        return;
    }

    const alvo = document.getElementById(botao.dataset.rolar);

    if (alvo) {
        alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    }
});

document.getElementById("busca-glossario").addEventListener("input", function(evento) {
    const termo = evento.target.value.trim().toLowerCase();
    let achou = 0;

    document.querySelectorAll("#lista-glossario details").forEach(function(item) {
        const bate = item.textContent.toLowerCase().includes(termo);

        item.hidden = !bate;

        if (termo && bate) {
            item.open = true;
        } else if (!termo) {
            item.open = false;
        }

        if (bate) {
            achou++;
        }
    });

    document.getElementById("glossario-vazio").hidden = achou > 0;
});

const formFeedback = document.getElementById("form-feedback");
const botaoEnviarFeedback = formFeedback.querySelector('button[type="submit"]');
const COR_FEEDBACK = { "Sugestão": 0xF0B93B, "Problema": 0xFB7185, "Elogio": 0x34D399 };

formFeedback.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const mensagem = document.getElementById("mensagem-feedback").value.trim();
    const tipo = document.querySelector('input[name="tipo-feedback"]:checked').value;

    if (!mensagem) {
        mostrarAviso("Escreva uma mensagem antes de enviar.");
        return;
    }

    if (!DISCORD_WEBHOOK) {
        mostrarAviso("O envio de feedback ainda não foi configurado. Cole o link do webhook do Discord em DISCORD_WEBHOOK no arquivo JavaScript.");
        return;
    }

    // Evita spam: no máximo 1 mensagem por minuto neste aparelho
    let ultimoEnvio = 0;

    try {
        ultimoEnvio = Number(localStorage.getItem("ultimoFeedback")) || 0;
    } catch (erro) {
        ultimoEnvio = 0;
    }

    if (Date.now() - ultimoEnvio < 60000) {
        mostrarAviso("Você acabou de enviar uma mensagem. Aguarde um minuto para enviar outra.");
        return;
    }

    botaoEnviarFeedback.disabled = true;

    try {
        const resposta = await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "Feedback do app",
                embeds: [{
                    title: `${tipo} • v${VERSAO_APP}`,
                    description: mensagem.slice(0, 1000),
                    color: COR_FEEDBACK[tipo],
                    fields: [{
                        name: "Aparelho",
                        value: window.matchMedia("(max-width: 899px)").matches ? "Celular" : "Computador",
                        inline: true
                    }],
                    timestamp: new Date().toISOString()
                }]
            })
        });

        if (!resposta.ok) {
            throw new Error("Falha no envio");
        }

        try {
            localStorage.setItem("ultimoFeedback", String(Date.now()));
        } catch (erro) {
            // Sem armazenamento: apenas não limita os envios
        }

        formFeedback.reset();
        mostrarAviso("Mensagem enviada com sucesso! Obrigado por ajudar a melhorar o app.", "sucesso");
    } catch (erro) {
        mostrarAviso("Não foi possível enviar agora. Verifique a internet e tente de novo.", "erro");
    } finally {
        botaoEnviarFeedback.disabled = false;
    }
});

// 22.4 Botões "Sobre" (menu lateral e cabeçalho do celular)
(function criarBotoesSobre() {
    const item = {
        id: "sobre",
        rotulo: "Sobre",
        icone: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
    };

    const rodape = document.querySelector(".menu-rodape");
    const botaoMenu = criarBotaoMenu(item, "menu-item menu-sobre");

    rodape.insertBefore(botaoMenu, rodape.firstChild);

    const cabecalho = document.querySelector("header");
    const botaoCabecalho = criarBotaoMenu(item, "botao-tema botao-sobre");

    botaoCabecalho.setAttribute("aria-label", "Sobre o app");
    cabecalho.querySelector(".header-acoes").insertBefore(botaoCabecalho, cabecalho.querySelector(".botao-tema"));
})();

// 22.5 Tutorial de boas-vindas (abre sozinho na primeira visita)
const PASSOS_TUTORIAL = [
    {
        pose: "acenar",
        titulo: "Oi! Eu sou o Bufunfa 👋",
        texto: "Vou te mostrar o app em menos de 1 minuto. É rapidinho, prometo!"
    },
    {
        alvo: "#inicio .painel-card.col-2",
        pose: "apontar",
        titulo: "Seu saldo, num relance",
        texto: "Aqui você vê o saldo acumulado e o que sobra no mês. O olhinho esconde os valores quando tiver gente por perto."
    },
    {
        alvo: "#botao-abrir-receita",
        pose: "moeda",
        titulo: "Registre o que entra",
        texto: "Use este botão sempre que receber dinheiro. Dá para ajustar o valor do mês depois."
    },
    {
        alvo: "#inicio .resumo-despesas",
        pose: "apontar",
        titulo: "Receitas e despesas",
        texto: "Toque em um dos dois cards para ver, item por item, o que forma o total do mês."
    },
    {
        alvo: "#card-vencimentos",
        pose: "apontar",
        titulo: "Nada de esquecer conta",
        texto: "Os vencimentos do mês aparecem aqui, com o status de pago ou pendente. Dá para expandir o calendário."
    },
    {
        alvo: "#card-cotacao",
        pose: "apontar",
        titulo: "Cotação de moedas",
        texto: "Acompanhe o dólar, o euro e outras moedas sem sair do app."
    },
    {
        menu: "gastos",
        pose: "apontar",
        titulo: "Suas despesas",
        texto: "Cadastre gastos avulsos, recorrentes ou parcelados no cartão, e pause as recorrentes quando precisar."
    },
    {
        menu: "planejamento",
        pose: "apontar",
        titulo: "Metas",
        texto: "Defina objetivos e acompanhe o progresso de cada um."
    },
    {
        menu: "reserva-emergencia",
        pose: "apontar",
        titulo: "Reserva e investimentos",
        texto: "Guarde para os imprevistos, cadastre seus investimentos e simule quanto eles podem render."
    },
    {
        menu: "relatorios",
        pose: "apontar",
        titulo: "Relatórios e comparativo",
        texto: "Veja gráficos do seu mês e compare períodos para entender como o dinheiro anda."
    },
    {
        menu: "backup",
        pose: "apontar",
        titulo: "Guarde seus dados",
        texto: "Tudo fica salvo neste aparelho. Faça backup de vez em quando para não perder nada."
    },
    {
        menu: "sobre",
        pose: "acenar",
        final: true,
        titulo: "Pronto! Qualquer dúvida…",
        texto: "Se quiser rever este tutorial, é só abrir o painel Sobre. Lá também tem a nossa história, o glossário e as novidades."
    }
];

const tutorial = {
    indice: 0,
    aberto: false,
    origemSobre: false,
    fechando: false,
    raiz: null
};

function alvoVisivel(seletor) {
    return Array.from(document.querySelectorAll(seletor)).find(function(el) {
        const caixa = el.getBoundingClientRect();
        return caixa.width > 0 && caixa.height > 0;
    }) || null;
}

function elementoDoPasso(passo) {
    if (passo.menu) {
        return alvoVisivel(`[data-secao="${passo.menu}"]`);
    }

    return passo.alvo ? alvoVisivel(passo.alvo) : null;
}

function montarTutorial() {
    const raiz = document.createElement("div");

    raiz.id = "tutorial";
    raiz.hidden = true;
    raiz.setAttribute("role", "dialog");
    raiz.setAttribute("aria-modal", "true");
    raiz.setAttribute("aria-label", "Tutorial de boas-vindas");
    raiz.innerHTML = `
        <div class="tut-foco" id="tut-foco"></div>
        <div class="tut-balao" id="tut-balao">
            <div class="tut-corpo">
                <div class="tut-mascote" id="tut-mascote"></div>
                <div class="tut-texto">
                    <span class="tut-passo" id="tut-passo"></span>
                    <h3 id="tut-titulo"></h3>
                    <p id="tut-conteudo"></p>
                </div>
            </div>
            <div class="tut-pontos" id="tut-pontos"></div>
            <div class="tut-acoes">
                <button type="button" class="tut-pular" id="tut-pular">Pular</button>
                <span class="tut-espaco"></span>
                <button type="button" class="tut-voltar" id="tut-voltar">Voltar</button>
                <button type="button" class="tut-proximo" id="tut-proximo">Próximo</button>
            </div>
        </div>`;

    document.body.appendChild(raiz);
    tutorial.raiz = raiz;

    document.getElementById("tut-pular").addEventListener("click", function() {
        fecharTutorial(false);
    });
    document.getElementById("tut-voltar").addEventListener("click", function() {
        if (tutorial.indice > 0) {
            tutorial.indice--;
            mostrarPassoTutorial();
        }
    });
    document.getElementById("tut-proximo").addEventListener("click", function() {
        if (tutorial.indice >= PASSOS_TUTORIAL.length - 1) {
            fecharTutorial(true);
        } else {
            tutorial.indice++;
            mostrarPassoTutorial();
        }
    });
}

function mostrarPassoTutorial() {
    const passo = PASSOS_TUTORIAL[tutorial.indice];
    const total = PASSOS_TUTORIAL.length - 1;
    const balao = document.getElementById("tut-balao");
    const foco = document.getElementById("tut-foco");
    const alvo = elementoDoPasso(passo);
    const centralizado = !alvo;

    document.getElementById("tut-titulo").textContent = passo.titulo;
    document.getElementById("tut-conteudo").textContent = passo.texto;
    document.getElementById("tut-passo").textContent = tutorial.indice === 0 || passo.final ? "" : `Passo ${tutorial.indice} de ${total - 1}`;
    document.getElementById("tut-passo").hidden = tutorial.indice === 0 || passo.final;
    document.getElementById("tut-voltar").style.visibility = tutorial.indice > 0 ? "visible" : "hidden";
    document.getElementById("tut-pular").style.visibility = passo.final ? "hidden" : "visible";
    document.getElementById("tut-proximo").textContent = passo.final ? "Concluir" : (tutorial.indice === 0 ? "Vamos lá!" : "Próximo");
    document.getElementById("tut-pontos").innerHTML = PASSOS_TUTORIAL.map(function(_, i) {
        return `<i class="${i === tutorial.indice ? "ativo" : ""}"></i>`;
    }).join("");

    document.getElementById("tut-mascote").innerHTML = criarMascote(passo.pose);
    balao.classList.toggle("centro", centralizado);
    foco.classList.toggle("sem", centralizado);

    const largura = window.innerWidth;
    const altura = window.innerHeight;

    if (centralizado) {
        foco.style.cssText = "left:50%;top:50%;width:0;height:0";
        balao.style.left = Math.max(12, (largura - balao.offsetWidth) / 2) + "px";
        balao.style.top = Math.max(12, (altura - balao.offsetHeight) / 2) + "px";
        return;
    }

    alvo.scrollIntoView({ block: "center", behavior: "auto" });

    const caixa = alvo.getBoundingClientRect();
    const folga = 6;

    foco.style.left = (caixa.left - folga) + "px";
    foco.style.top = (caixa.top - folga) + "px";
    foco.style.width = (caixa.width + folga * 2) + "px";
    foco.style.height = (caixa.height + folga * 2) + "px";

    const larguraBalao = balao.offsetWidth;
    const alturaBalao = balao.offsetHeight;
    let x = caixa.right + 18;
    let y = caixa.top + caixa.height / 2 - alturaBalao / 2;

    if (x + larguraBalao > largura - 12) {
        // Não cabe ao lado: tenta embaixo, depois em cima, senão fixa no rodapé
        x = Math.min(largura - larguraBalao - 12, Math.max(12, caixa.left));
        y = caixa.bottom + 18;

        if (y + alturaBalao > altura - 12) {
            y = caixa.top - alturaBalao - 18;
        }

        if (y < 12) {
            y = altura - alturaBalao - 16;
        }
    }

    x = Math.max(12, x);
    y = Math.max(12, Math.min(y, altura - alturaBalao - 12));
    balao.style.left = x + "px";
    balao.style.top = y + "px";

    // O flipper do mascote aponta na direção do elemento destacado
    const dx = (caixa.left + caixa.width / 2) - (x + 45);
    const dy = (caixa.top + caixa.height / 2) - (y + 55);
    const graus = Math.max(25, Math.min(170, Math.atan2(-dx, dy) * 180 / Math.PI));

    balao.style.setProperty("--ang-braco", graus + "deg");
}

function abrirTutorial(aPartirDoSobre) {
    if (!tutorial.raiz) {
        montarTutorial();
    }

    tutorial.origemSobre = !!aPartirDoSobre;
    tutorial.indice = 0;
    tutorial.aberto = true;
    tutorial.fechando = false;
    tutorial.raiz.classList.remove("saindo");

    abrirSecao("inicio", true);
    tutorial.raiz.hidden = false;
    document.body.classList.add("tutorial-aberto");
    mostrarPassoTutorial();
    document.getElementById("tut-proximo").focus();
}

function fecharTutorial(comConfete) {
    if (tutorial.fechando || !tutorial.aberto) {
        return;
    }

    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    tutorial.fechando = true;
    tutorial.aberto = false;

    try {
        localStorage.setItem("tutorialVisto", "1");
    } catch (erro) {
        // Sem armazenamento: o tutorial pode aparecer de novo na próxima visita
    }

    if (comConfete === true) {
        const caixa = document.getElementById("tut-balao").getBoundingClientRect();
        const largura = window.innerWidth;
        const altura = window.innerHeight;

        soltarConfetes(caixa.left + caixa.width / 2, caixa.top + caixa.height * 0.25, 60, { direcao: -90, abertura: 120 });
        soltarConfetes(0, altura, 45, { direcao: -55, abertura: 50, potencia: 1.5 });
        soltarConfetes(largura, altura, 45, { direcao: -125, abertura: 50, potencia: 1.5 });
    }

    tutorial.raiz.classList.add("saindo");

    setTimeout(function() {
        tutorial.raiz.hidden = true;
        tutorial.raiz.classList.remove("saindo");
        tutorial.fechando = false;
        document.body.classList.remove("tutorial-aberto");

        if (tutorial.origemSobre) {
            abrirSecao("sobre", true);
        }
    }, reduzido ? 0 : 400);
}

document.getElementById("botao-rever-tutorial").addEventListener("click", function() {
    abrirTutorial(true);
});

window.addEventListener("resize", function() {
    if (tutorial.aberto) {
        mostrarPassoTutorial();
    }
});

document.addEventListener("keydown", function(evento) {
    if (!tutorial.aberto) {
        return;
    }

    if (evento.key === "Escape") {
        fecharTutorial(false);
    } else if (evento.key === "ArrowRight" || evento.key === "Enter") {
        document.getElementById("tut-proximo").click();
    } else if (evento.key === "ArrowLeft") {
        document.getElementById("tut-voltar").click();
    }
});

// Primeira visita: o tutorial abre sozinho (depois só pelo botão do Sobre)
(function iniciarTutorialNaPrimeiraVisita() {
    let visto = false;

    try {
        visto = localStorage.getItem("tutorialVisto") === "1";
    } catch (erro) {
        visto = false;
    }

    if (!visto) {
        setTimeout(function() {
            abrirTutorial(false);
        }, 700);
    }
})();

// Sempre que a página é aberta ou recarregada (F5), começa no Início
abrirSecao("inicio", true);

// 21.4 Buscar cotações e taxas (sem internet, usa o último valor salvo)
atualizarTudoApis(false);