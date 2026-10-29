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
formReceita.onsubmit = function(event) {
    event.preventDefault();

    // 2.1 Pegar o valor digitado
    let receita = campoReceita.value;

    // 2.2 Guardar a receita como número
    let receitaNumero = Number(receita);

    // 2.2.1 Validar o valor da receita
    if (!Number.isFinite(receitaNumero) || receitaNumero <= 0) {
        alert("Informe uma receita válida maior que zero.");
        return;
    }

    // 2.3 Pegar o mês escolhido
    let mesReceita = campoMesReceita.value;

    // 2.3.1 Validar o mês da receita
    if (!mesReceita) {
        alert("Selecione o mês da receita.");
        return;
    }

    // 2.4 Procurar uma receita do mesmo mês
    let receitaExistente = receitas.find(function(receita) {
        return receita.mes === mesReceita;
    });

    // 2.5 Atualizar ou guardar a receita
    const descricaoReceita = campoDescricaoReceita.value.trim();

    if (receitaExistente) {
        receitaExistente.valor = receitaNumero;
        receitaExistente.descricao = descricaoReceita;
        receitaExistente.registradoEm = Date.now();
    } else {
        let novaReceita = {
            mes: mesReceita,
            valor: receitaNumero,
            descricao: descricaoReceita,
            registradoEm: Date.now()
        };

        receitas.push(novaReceita);
    }

    localStorage.setItem("receitas", JSON.stringify(receitas));

    // 2.6 Selecionar no resumo o mês da receita cadastrada
    filtroMes.value = mesReceita;
    atualizarHistorico();

    // 2.7 Atualizar o resumo mensal
    atualizarResumoMensal();

    // 2.8 Atualizar saldo restante
    atualizarSaldo();

    // 2.9 Fechar a janela de receita
    fecharModalReceita();
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
        alert("Informe um valor válido maior que zero.");
        return;
    }

    // 4.2.1 Validar a descrição e a data da despesa
    if (!descricao.trim() || !data || !categoria.trim()) {
        alert("Informe a descrição, a data e a categoria da despesa.");
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
    camposRecorrencia.hidden = true;
    frequenciaRecorrencia.required = false;
    diaVencimento.required = false;
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
    orcamento: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
};

function criarBotaoIcone(icone, rotulo, aoClicar) {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = "botao-icone";
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

        let quantidade = gastos.filter(function(despesa) {
            return despesa.categoria === nomeCategoria;
        }).length;

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
        alert("Digite um nome para a categoria.");
        return;
    }

    let categoriaExistente = categorias.some(function(categoria) {
        return categoria.toLowerCase() === nomeCategoria.toLowerCase();
    });

    if (categoriaExistente) {
        alert("Essa categoria já existe.");
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
function definirOrcamento(nomeCategoria) {
    let atual = Number(orcamentos[nomeCategoria]) > 0
        ? orcamentos[nomeCategoria]
        : "";

    let resposta = prompt(
        `Orçamento mensal para "${nomeCategoria}" (deixe vazio para remover):`,
        atual
    );

    if (resposta === null) {
        return;
    }

    resposta = resposta.trim().replace(",", ".");

    if (resposta === "") {
        delete orcamentos[nomeCategoria];
    } else {
        let valor = Number(resposta);

        if (!Number.isFinite(valor) || valor <= 0) {
            alert("Informe um valor maior que zero.");
            return;
        }

        orcamentos[nomeCategoria] = valor;
    }

    salvarOrcamentos();
    mostrarListaCategorias();
    atualizarPainel();
}

// 4.10.9 Editar uma categoria
function editarCategoria(categoriaSelecionada) {
    let novoNome = prompt(
        "Digite o novo nome da categoria:",
        categoriaSelecionada
    );

    if (novoNome === null) {
        return;
    }

    novoNome = novoNome.trim();

    if (novoNome === "") {
        alert("O nome da categoria não pode ficar vazio.");
        return;
    }

    let nomeExistente = categorias.some(function(categoria) {
        return categoria.toLowerCase() === novoNome.toLowerCase()
            && categoria !== categoriaSelecionada;
    });

    if (nomeExistente) {
        alert("Já existe uma categoria com esse nome.");
        return;
    }

    let indice = categorias.indexOf(categoriaSelecionada);

    if (indice === -1) {
        alert("Categoria não encontrada.");
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
function excluirCategoria(categoriaSelecionada) {
    let categoriaEmUso = gastos.some(function(despesa) {
        return despesa.categoria === categoriaSelecionada;
    });

    if (categoriaEmUso) {
        alert(
            "Essa categoria está sendo usada em despesas. " +
            "Edite ou exclua essas despesas antes de excluir a categoria."
        );
        return;
    }

    if (!confirm(`Deseja excluir a categoria "${categoriaSelecionada}"?`)) {
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
    titulo.textContent = despesa.descricao;

    let meta = document.createElement("span");
    meta.className = "linha-meta";
    meta.textContent =
        `${formatarDataBR(despesa.data)} · ${despesa.categoria || "Sem categoria"}`;

    info.appendChild(titulo);
    info.appendChild(meta);

    // Valor e status de pagamento
    let direita = document.createElement("div");
    direita.className = "linha-direita";

    let valor = document.createElement("span");
    valor.className = "linha-valor";
    valor.textContent = formatarMoeda(despesa.valor);

    direita.appendChild(valor);

    // O status de pagamento existe somente nas despesas recorrentes
    if (despesa.recorrente) {
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

    item.appendChild(info);
    item.appendChild(direita);

    if (comAcoes) {
        let acoes = document.createElement("div");
        acoes.className = "linha-acoes";

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

            if (Number.isFinite(valor)) {
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
        return despesa.recorrente && !despesa.paga;
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

        if (Number.isFinite(valor)) {
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
        return typeof despesa.data === "string" &&
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

// 5.4 Carregar a receita do mês
function carregarReceitaDoMes() {
    let mesSelecionado = campoMesReceita.value;
    let valorReceita = buscarReceitaDoMes(mesSelecionado);

    if (receitas.some(function(receita) {
        return receita.mes === mesSelecionado;
    })) {
        campoReceita.value = valorReceita;
        campoDescricaoReceita.value = receitas.find(function(receita) {
            return receita.mes === mesSelecionado;
        }).descricao || "";
    } else {
        campoReceita.value = "";
        campoDescricaoReceita.value = "";
    }
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
        alert("Informe um nome e um valor válido para a meta, maior que zero.");
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
        alert("Selecione uma meta para registrar o aporte.");
        return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
        alert("O valor do aporte deve ser maior que zero.");
        return;
    }

    const dataTeste = new Date(`${data}T00:00:00`);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
        Number.isNaN(dataTeste.getTime()) ||
        dataTeste.toISOString().slice(0, 10) !== data
    ) {
        alert("Informe uma data válida.");
        return;
    }

    // 8.3 Encontrar a meta escolhida
    let metaSelecionada = metas[Number(indiceMeta)];

    // 8.3.1 Impedir que o aporte seja associado a uma meta inexistente
    if (!metaSelecionada) {
        alert("A meta selecionada não foi encontrada.");
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
function excluirMeta(indice) {
    if (indice < 0 || indice >= metas.length) {
        return;
    }

    if (!confirm("Tem certeza de que deseja excluir esta meta?")) {
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
function excluirGasto(indice) {
    if (indice < 0 || indice >= gastos.length) {
        return;
    }

    if (!confirm("Tem certeza de que deseja excluir esta despesa?")) {
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
function editarGasto(despesa) {
    let novaDescricao = prompt("Digite a nova descrição:", despesa.descricao);

    if (novaDescricao === null) {
        return;
    }

    let novoValor = prompt("Digite o novo valor:", despesa.valor);

    if (novoValor === null) {
        return;
    }

    novoValor = Number(novoValor);

    if (
        novaDescricao.trim() === "" ||
        !Number.isFinite(novoValor) ||
        novoValor <= 0
    ) {
        alert("Informe uma descrição e um valor válido maior que zero.");
        return;
    }

    let novaData = prompt("Digite a nova data (AAAA-MM-DD):", despesa.data);

    if (novaData === null) {
        return;
    }

    // Validar o formato e a existência da data
    let dataTeste = new Date(`${novaData}T00:00:00`);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(novaData) ||
        Number.isNaN(dataTeste.getTime()) ||
        dataTeste.toISOString().slice(0, 10) !== novaData
    ) {
        alert("Informe uma data válida no formato AAAA-MM-DD.");
        return;
    }

    let novaCategoria = prompt("Digite a nova categoria:", despesa.categoria);

    if (novaCategoria === null) {
        return;
    }

    if (novaCategoria.trim() === "") {
        alert("A categoria não pode ficar vazia.");
        return;
    }

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
function excluirReceitaDoMes() {
    let mesSelecionado = campoMesReceita.value;

    let indice = receitas.findIndex(function(receita) {
        return receita.mes === mesSelecionado;
    });

    if (indice === -1) {
        alert("Não existe receita cadastrada para esse mês.");
        return;
    }

    if (!confirm("Tem certeza de que deseja excluir a receita deste mês?")) {
        return;
    }

    receitas.splice(indice, 1);

    localStorage.setItem("receitas", JSON.stringify(receitas));

    campoReceita.value = "";
    campoDescricaoReceita.value = "";

    atualizarResumoMensal();
    atualizarSaldo();
    fecharModalReceita();

    alert("Receita excluída com sucesso.");
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
const periodoReserva = document.getElementById("periodo-reserva");
const reservaMetaBloco = document.getElementById("reserva-meta-bloco");

// Resumo da reserva
const saldoDisponivelReserva = document.getElementById("saldo-disponivel-reserva");
const totalAportadoMes = document.getElementById("total-aportado-mes");
const totalReserva = document.getElementById("total-reserva");

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

// 14.4 Atualizar o resumo da reserva
function atualizarResumoReserva() {
    const mes = filtroMes.value;

    periodoReserva.textContent = mes ? nomeDoMes(mes) : "Todos os períodos";
    totalReserva.textContent = formatarMoeda(calcularTotalReserva());

    if (!mes) {
        saldoDisponivelReserva.textContent = "Selecione um mês";
        totalAportadoMes.textContent = "R$ 0,00";
    } else {
        const receita = buscarReceitaDoMes(mes);
        const despesas = somarDespesasDoMes(mes);
        const aportesMetas = somarAportesMetasDoMes(mes);
        const aportesInvestimentosMes = somarAportesInvestimentosDoMes(mes);

        const saldo = receita - despesas - aportesMetas - aportesInvestimentosMes;

        saldoDisponivelReserva.textContent = formatarMoeda(saldo);
        totalAportadoMes.textContent = formatarMoeda(aportesInvestimentosMes);
    }

    // Barra da meta da reserva (só aparece quando algum investimento tem meta)
    const resumoMeta = resumoMetaReserva();

    reservaMetaBloco.innerHTML = "";
    reservaMetaBloco.hidden = resumoMeta.meta <= 0;

    if (resumoMeta.meta > 0) {
        reservaMetaBloco.appendChild(
            criarBlocoProgresso("Meta da reserva", resumoMeta.acumulado, resumoMeta.meta, "selo-dourado")
        );
    }
}

// 14.5 Cadastrar investimentos
formReserva.addEventListener("submit", function(event) {
    event.preventDefault();

    const tipo = tipoInvestimento.value;
    const nome = nomeInvestimento.value.trim();
    const data = dataInvestimento.value;

    if (!tipo || !data) {
        alert("Preencha o tipo e o mês de início do investimento.");
        return;
    }

    const novoInvestimento = {
        id: Date.now(),
        tipo: tipo,
        nome: nome,
        dataInicial: data
    };

    const metaDigitada = Number(metaInvestimento.value);

    if (metaDigitada > 0) {
        novoInvestimento.meta = metaDigitada;
    }

    investimentos.push(novoInvestimento);

    localStorage.setItem(
        "investimentos",
        JSON.stringify(investimentos)
    );

    mostrarInvestimentos();
    atualizarOpcoesInvestimentos();
    atualizarResumoReserva();
    atualizarPainel();

    formReserva.reset();
    abrirTela(secaoReserva, "menu");

    alert("Investimento cadastrado com sucesso! Agora você pode registrar um aporte.");
});

// 14.6 Mostrar investimentos cadastrados
function mostrarInvestimentos() {
    listaInvestimentos.innerHTML = "";

    if (investimentos.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.className = "vazio";
        mensagem.textContent = "Nenhum investimento cadastrado.";
        listaInvestimentos.appendChild(mensagem);
        return;
    }

    investimentos.forEach(function(investimento) {
        const item = document.createElement("div");
        item.className = "linha-item";

        const total = aportesInvestimentos
            .filter(function(aporte) {
                return aporte.investimentoId === investimento.id;
            })
            .reduce(function(soma, aporte) {
                const valor = Number(aporte.valor);
                return soma + (Number.isFinite(valor) && valor > 0 ? valor : 0);
            }, 0);

        // 14.6.1 Exibir os dados do investimento com segurança
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

        info.appendChild(titulo);
        info.appendChild(detalhes);

        const valorMetaInvestimento = Number(investimento.meta);

        if (valorMetaInvestimento > 0) {
            const textoMeta = document.createElement("span");
            textoMeta.className = "linha-meta";

            const pct = Math.min((total / valorMetaInvestimento) * 100, 100);

            textoMeta.textContent = `Meta: ${formatarMoeda(valorMetaInvestimento)} · ` +
                `${pct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% concluído`;
            info.appendChild(textoMeta);
        }

        const direita = document.createElement("div");
        direita.className = "linha-direita";

        const valorTotal = document.createElement("span");
        valorTotal.className = "linha-valor";
        valorTotal.textContent = formatarMoeda(total);

        const rotulo = document.createElement("span");
        rotulo.className = "linha-meta";
        rotulo.textContent = "investido";

        direita.appendChild(valorTotal);
        direita.appendChild(rotulo);

        // Botão para excluir o investimento
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

        // Adicionar o investimento à página
        listaInvestimentos.appendChild(item);
    });
}

// 14.6.2 Definir (ou remover) a meta de um investimento
function definirMetaInvestimento(id) {
    const investimento = investimentos.find(function(item) {
        return item.id === id;
    });

    if (!investimento) {
        return;
    }

    const resposta = prompt(
        `Meta em R$ para "${investimento.nome || investimento.tipo}" (deixe vazio para remover):`,
        Number(investimento.meta) > 0 ? investimento.meta : ""
    );

    if (resposta === null) {
        return;
    }

    const texto = resposta.trim().replace(",", ".");

    if (texto === "") {
        delete investimento.meta;
    } else {
        const valor = Number(texto);

        if (!Number.isFinite(valor) || valor <= 0) {
            alert("Informe um valor maior que zero.");
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
        alert("Cadastre ou selecione um investimento válido.");
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
        alert("Informe um valor positivo e uma data válida.");
        return;
    }

    aportesInvestimentos.push({
        investimentoId: investimentoId,
        valor: valor,
        data: data,
        registradoEm: Date.now()
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
function excluirInvestimento(id) {
    const investimento = investimentos.find(function(item) {
        return item.id === id;
    });

    if (!investimento) {
        alert("Investimento não encontrado.");
        return;
    }

    if (!confirm(
        `Tem certeza de que deseja excluir o investimento "${investimento.nome || investimento.tipo}" e todos os aportes associados a ele?`
    )) {
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

    // Atualizar a tela e os cálculos
    mostrarInvestimentos();
    atualizarOpcoesInvestimentos();
    atualizarResumoMensal();
    atualizarSaldo();

    alert("Investimento excluído com sucesso.");
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

    leitor.onload = function(event) {
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
                alert("O arquivo selecionado não é um backup válido.");
                arquivoBackup.value = "";
                return;
            }

            if (!confirm(
                "Restaurar este backup substituirá os dados atuais. Deseja continuar?"
            )) {
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

            alert("Backup restaurado com sucesso!");
        } catch (erro) {
            alert("Não foi possível restaurar o backup. Verifique se o arquivo é válido e tente novamente.");
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

        if (typeof despesa.data === "string" && despesa.data.slice(0, 7) <= mesAtual && Number.isFinite(valor)) {
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
        if (typeof despesa.data === "string" && despesa.data.startsWith(mesSelecionado)) {
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
function resumoMetaReserva() {
    let acumulado = 0;
    let meta = 0;

    investimentos.forEach(function(investimento) {
        const valorMeta = Number(investimento.meta);

        if (!(valorMeta > 0)) {
            return;
        }

        meta += valorMeta;

        aportesInvestimentos.forEach(function(aporte) {
            const valor = Number(aporte.valor);

            if (aporte.investimentoId === investimento.id && Number.isFinite(valor) && valor > 0) {
                acumulado += valor;
            }
        });
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
    valorReserva.textContent = formatarMoeda(calcularTotalReserva());

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
        const valor = Number(receita.valor);
        const data = receita.registradoEm
            ? dataDoCarimbo(receita.registradoEm)
            : `${receita.mes}-01`;

        if (data <= hoje && Number.isFinite(valor)) {
            itens.push({
                tipo: "receita",
                titulo: receita.descricao || "Receita mensal",
                detalhe: `Receita de ${nomeDoMes(receita.mes).toLowerCase()}`,
                data: data,
                ordem: receita.registradoEm || 0,
                valor: valor
            });
        }
    });

    gastos.forEach(function(despesa) {
        const valor = Number(despesa.valor);

        if (typeof despesa.data !== "string" || !Number.isFinite(valor)) {
            return;
        }

        if (despesa.recorrente) {
            // Conta recorrente: só entra aqui quando é marcada como paga
            if (!despesa.paga) {
                return;
            }

            const dataPagamento = despesa.dataPagamento || despesa.data;

            if (dataPagamento <= hoje) {
                itens.push({
                    tipo: "despesa",
                    titulo: despesa.descricao,
                    detalhe: `Conta recorrente paga · ${despesa.categoria || "Sem categoria"}`,
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
                titulo: despesa.descricao,
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

        if (typeof despesa.data === "string" &&
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
function calcularProjecao(saldoInicial, aporteMensal, taxaMensal, meses) {
    let saldo = saldoInicial;

    for (let i = 0; i < meses; i++) {
        saldo = (saldo + aporteMensal) * (1 + taxaMensal);
    }

    const aportado = saldoInicial + aporteMensal * meses;

    return {
        total: saldo,
        aportado: aportado,
        juros: saldo - aportado
    };
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

    simTotal.textContent = formatarMoeda(resultado.total);
    simAportado.textContent = formatarMoeda(resultado.aportado);
    simJuros.textContent = formatarMoeda(resultado.juros);
    simPrazoTexto.textContent = meses > 0 ? `Projeção para ${descreverPrazo(meses)}.` : "";
}

// 22.5 Preencher o saldo inicial com o total da reserva ao abrir o simulador
function prepararSimulador() {
    if (!simSaldoEditado) {
        const reserva = calcularTotalReserva();
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

// 21.3 Menus e seção inicial
construirMenus();

let secaoSalva = "inicio";

try {
    secaoSalva = localStorage.getItem("secaoAtual") || "inicio";
} catch (erro) {
    // Sem armazenamento: começa no Início
}

abrirSecao(secaoSalva, true);