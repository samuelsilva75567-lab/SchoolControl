
// ==========================================
// SCHOOLCONTROL - SISTEMA PRINCIPAL
// ==========================================


// ==========================================
// 1. DADOS DOS ALUNOS E MOVIMENTAÇÕES
// ==========================================

let alunos = [];
let movimentacoes = [];

try {
    alunos = JSON.parse(
        localStorage.getItem("schoolcontrol_alunos")
    ) || [];

    movimentacoes = JSON.parse(
        localStorage.getItem("schoolcontrol_movimentacoes")
    ) || [];

} catch (erro) {
    alunos = [];
    movimentacoes = [];
}


// ==========================================
// 2. SALVAR DADOS
// ==========================================

function salvarAlunos() {
    localStorage.setItem(
        "schoolcontrol_alunos",
        JSON.stringify(alunos)
    );
}

function salvarMovimentacoes() {
    localStorage.setItem(
        "schoolcontrol_movimentacoes",
        JSON.stringify(movimentacoes)
    );
}


// ==========================================
// 3. PROTEGER TEXTOS
// ==========================================

function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, letra => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[letra]);
}


// ==========================================
// 4. DATA LOCAL
// ==========================================

function dataDeHoje() {
    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


// ==========================================
// 5. ATUALIZAR CONTADORES
// ==========================================

function atualizarResumo() {
    const totalAlunos = document.getElementById("totalAlunos");
    const totalEntradas = document.getElementById("totalEntradas");
    const totalSaidas = document.getElementById("totalSaidas");

    const hoje = dataDeHoje();

    const registrosHoje = movimentacoes.filter(
        item => item.dia === hoje
    );

    if (totalAlunos) {
        totalAlunos.textContent = alunos.length;
    }

    if (totalEntradas) {
        totalEntradas.textContent = registrosHoje.filter(
            item => item.tipo === "Entrada"
        ).length;
    }

    if (totalSaidas) {
        totalSaidas.textContent = registrosHoje.filter(
            item => item.tipo === "Saída"
        ).length;
    }
}


// ==========================================
// 6. NAVEGAÇÃO
// ==========================================

function abrirTela(tela) {
    const area = document.getElementById("areaConteudo");

    if (!area) return;

    if (tela === "inicio") {

        area.innerHTML = `
            <h2>Bem-vindo ao SchoolControl!</h2>
            <p>Este é o painel principal do sistema escolar.</p>
        `;

    } else if (tela === "alunos") {

        mostrarTelaAlunos();

    } else if (tela === "entrada") {

        mostrarTelaMovimentacao();

    } else if (tela === "historico") {

        mostrarHistorico();

    } else if (tela === "relatorios") {

        mostrarRelatorios();

    }
}


// ==========================================
// 7. TELA DE ALUNOS
// ==========================================

function mostrarTelaAlunos() {
    const area = document.getElementById("areaConteudo");

    area.innerHTML = `
        <h2>Gestão de Alunos</h2>
        <p>Cadastre e consulte os alunos.</p>

        <form id="formAluno">

            <label>Nome do aluno</label>
            <input
                type="text"
                id="nomeAluno"
                placeholder="Digite o nome"
                required
            >

            <label>Turma</label>
            <input
                type="text"
                id="turmaAluno"
                placeholder="Ex: 8º ano A"
                required
            >

            <label>Matrícula</label>
            <input
                type="text"
                id="matriculaAluno"
                placeholder="Digite uma matrícula fictícia"
                required
            >

            <button type="submit">
                Cadastrar aluno
            </button>

        </form>

        <h3>Alunos cadastrados</h3>

        <div id="listaAlunos"></div>
    `;

    document.getElementById("formAluno").addEventListener(
        "submit",
        cadastrarAluno
    );

    atualizarListaAlunos();
}


// ==========================================
// 8. CADASTRAR ALUNO
// ==========================================

function cadastrarAluno(event) {
    event.preventDefault();

    const nome = document.getElementById("nomeAluno").value.trim();
    const turma = document.getElementById("turmaAluno").value.trim();
    const matricula = document.getElementById("matriculaAluno").value.trim();

    if (!nome || !turma || !matricula) {
        alert("Preencha todos os campos.");
        return;
    }

    const existe = alunos.some(
        aluno => aluno.matricula === matricula
    );

    if (existe) {
        alert("Essa matrícula já está cadastrada.");
        return;
    }

    alunos.push({
        id: crypto.randomUUID(),
        nome,
        turma,
        matricula
    });

    salvarAlunos();
    atualizarResumo();
    mostrarTelaAlunos();

    alert("Aluno cadastrado com sucesso!");
}


// ==========================================
// 9. LISTAR ALUNOS
// ==========================================

function atualizarListaAlunos() {
    const lista = document.getElementById("listaAlunos");

    if (!lista) return;

    if (alunos.length === 0) {
        lista.innerHTML = "<p>Nenhum aluno cadastrado ainda.</p>";
        return;
    }

    lista.innerHTML = alunos.map(aluno => `
        <div class="aluno-item">

            <strong>${escaparHTML(aluno.nome)}</strong>

            <p>Turma: ${escaparHTML(aluno.turma)}</p>

            <p>Matrícula: ${escaparHTML(aluno.matricula)}</p>

        </div>
    `).join("");
}


// ==========================================
// 10. TELA DE ENTRADA E SAÍDA
// ==========================================

function mostrarTelaMovimentacao() {
    const area = document.getElementById("areaConteudo");

    const opcoes = alunos.map(aluno => `
        <option value="${escaparHTML(aluno.id)}">
            ${escaparHTML(aluno.nome)} - ${escaparHTML(aluno.turma)}
        </option>
    `).join("");

    area.innerHTML = `
        <div class="cabecalho-movimentacao">

            <h2>Controle de Entrada e Saída</h2>

            <p>Selecione um aluno para registrar sua movimentação.</p>

        </div>

        <div class="painel-movimentacao">

            <form id="formMovimentacao" class="form-movimentacao">

                <div class="campo-aluno">

                    <label for="alunoMovimentacao">
                        Selecionar aluno
                    </label>

                    <select id="alunoMovimentacao" required>

                        <option value="">
                            Escolha um aluno
                        </option>

                        ${opcoes}

                    </select>

                </div>

                <div class="botoes-movimentacao">

                    <button
                        type="submit"
                        name="tipo"
                        value="Entrada"
                        class="botao-entrada"
                        ${alunos.length === 0 ? "disabled" : ""}
                    >
                        Registrar Entrada
                    </button>

                    <button
                        type="submit"
                        name="tipo"
                        value="Saída"
                        class="botao-saida"
                        ${alunos.length === 0 ? "disabled" : ""}
                    >
                        Registrar Saída
                    </button>

                </div>

            </form>

            ${alunos.length === 0 ? `
                <p class="aviso-alunos">
                    Cadastre um aluno antes de registrar uma movimentação.
                </p>
            ` : ""}

        </div>

        <div class="area-recentes">

            <h3>Movimentações Recentes</h3>

            <div id="movimentacoesRecentes"></div>

        </div>
    `;

    const formulario = document.getElementById("formMovimentacao");

    formulario.addEventListener(
        "submit",
        registrarMovimentacao
    );

    mostrarMovimentacoesRecentes();
}


// ==========================================
// 11. REGISTRAR MOVIMENTAÇÃO
// ==========================================

function registrarMovimentacao(event) {
    event.preventDefault();

    const tipo = event.submitter?.value;

    const alunoId = document.getElementById(
        "alunoMovimentacao"
    ).value;

    const aluno = alunos.find(
        item => item.id === alunoId
    );

    if (!aluno) {
        alert("Selecione um aluno válido.");
        return;
    }

    if (tipo !== "Entrada" && tipo !== "Saída") {
        alert("Tipo de movimentação inválido.");
        return;
    }

    const agora = new Date();

    movimentacoes.unshift({
        id: crypto.randomUUID(),
        alunoId: aluno.id,
        nome: aluno.nome,
        turma: aluno.turma,
        tipo: tipo,
        dataHora: agora.toISOString(),
        dia: dataDeHoje()
    });

    salvarMovimentacoes();

    atualizarResumo();

    mostrarTelaMovimentacao();

    alert(`${tipo} registrada com sucesso!`);
}


// ==========================================
// 12. MOVIMENTAÇÕES RECENTES
// ==========================================

function mostrarMovimentacoesRecentes() {
    const lista = document.getElementById(
        "movimentacoesRecentes"
    );

    if (!lista) return;

    const recentes = movimentacoes.slice(0, 10);

    if (recentes.length === 0) {
        lista.innerHTML = `
            <p>Nenhuma movimentação registrada.</p>
        `;
        return;
    }

    lista.innerHTML = recentes.map(item => `
        <div class="aluno-item">

            <strong>${escaparHTML(item.nome)}</strong>

            <p>Turma: ${escaparHTML(item.turma)}</p>

            <p>Tipo: ${escaparHTML(item.tipo)}</p>

            <p>
                Data e horário:
                ${new Date(item.dataHora).toLocaleString("pt-BR")}
            </p>

        </div>
    `).join("");
}


// ==========================================
// 13. TELA DE HISTÓRICO
// ==========================================

function mostrarHistorico() {
    const area = document.getElementById("areaConteudo");

    area.innerHTML = `
        <div class="cabecalho-historico">

            <h2>Histórico de Movimentações</h2>

            <p>Consulte todas as entradas e saídas dos alunos.</p>

        </div>

        <div class="painel-historico">

            <div class="topo-historico">

                <h3>Registros realizados</h3>

                <span class="total-registros" id="totalHistorico">
                    ${movimentacoes.length} registros
                </span>

            </div>

            <input
                type="text"
                id="pesquisaHistorico"
                placeholder="Pesquisar aluno pelo nome..."
                oninput="filtrarHistorico()"
            >

            <select
                id="filtroTipoHistorico"
                onchange="filtrarHistorico()"
            >

                <option value="">
                    Todas as movimentações
                </option>

                <option value="Entrada">
                    Somente entradas
                </option>

                <option value="Saída">
                    Somente saídas
                </option>

            </select>

            <button
                type="button"
                onclick="limparHistorico()"
            >
                Limpar histórico
            </button>

            <div class="tabela-responsiva">

                <table class="tabela-historico">

                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Turma</th>
                            <th>Movimentação</th>
                            <th>Data e horário</th>
                        </tr>
                    </thead>

                    <tbody id="corpoHistorico"></tbody>

                </table>

            </div>

        </div>
    `;

    filtrarHistorico();
}


// ==========================================
// 14. FILTRAR HISTÓRICO
// ==========================================

function filtrarHistorico() {
    const campoPesquisa = document.getElementById(
        "pesquisaHistorico"
    );

    const campoTipo = document.getElementById(
        "filtroTipoHistorico"
    );

    const corpo = document.getElementById("corpoHistorico");
    const total = document.getElementById("totalHistorico");

    if (!campoPesquisa || !campoTipo || !corpo || !total) {
        return;
    }

    const pesquisa = campoPesquisa.value.toLowerCase().trim();

    const tipo = campoTipo.value;

    const filtradas = movimentacoes.filter(item => {

        const nomeCombina = item.nome.toLowerCase().includes(pesquisa);

        const tipoCombina = tipo === "" || item.tipo === tipo;

        return nomeCombina && tipoCombina;

    });

    total.textContent = `${filtradas.length} registros`;

    if (filtradas.length === 0) {

        corpo.innerHTML = `
            <tr>
                <td colspan="4" class="historico-vazio">
                    Nenhuma movimentação encontrada.
                </td>
            </tr>
        `;

        return;
    }

    corpo.innerHTML = filtradas.map(item => `
        <tr>

            <td>${escaparHTML(item.nome)}</td>

            <td>${escaparHTML(item.turma)}</td>

            <td>
                <span class="status-movimentacao ${
                    item.tipo === "Entrada"
                        ? "status-entrada"
                        : "status-saida"
                }">
                    ${escaparHTML(item.tipo)}
                </span>
            </td>

            <td>
                ${new Date(item.dataHora).toLocaleString("pt-BR")}
            </td>

        </tr>
    `).join("");
}


// ==========================================
// 15. LIMPAR HISTÓRICO
// ==========================================

function limparHistorico() {
    if (movimentacoes.length === 0) {
        alert("O histórico já está vazio.");
        return;
    }

    const confirmar = confirm(
        "Tem certeza que deseja apagar todo o histórico de movimentações? Essa ação não poderá ser desfeita."
    );

    if (!confirmar) {
        return;
    }

    movimentacoes = [];

    salvarMovimentacoes();

    filtrarHistorico();

    mostrarMovimentacoesRecentes();

    atualizarResumo();

    alert("Histórico apagado com sucesso!");
}


// ==========================================
// 16. TELA DE RELATÓRIOS
// ==========================================

function mostrarRelatorios() {
    const area = document.getElementById("areaConteudo");

    const hoje = dataDeHoje();

    const registrosHoje = movimentacoes.filter(
        item => item.dia === hoje
    );

    const entradasHoje = registrosHoje.filter(
        item => item.tipo === "Entrada"
    ).length;

    const saidasHoje = registrosHoje.filter(
        item => item.tipo === "Saída"
    ).length;

    area.innerHTML = `
        <div class="cabecalho-relatorios">

            <h2>Relatórios Escolares</h2>

            <p>Consulte e exporte as movimentações do SchoolControl.</p>

        </div>

        <div class="painel-relatorios">

            <div class="cartoes-relatorios">

                <div class="cartao-relatorio">
                    <h3>Alunos cadastrados</h3>
                    <strong>${alunos.length}</strong>
                </div>

                <div class="cartao-relatorio">
                    <h3>Entradas de hoje</h3>
                    <strong>${entradasHoje}</strong>
                </div>

                <div class="cartao-relatorio">
                    <h3>Saídas de hoje</h3>
                    <strong>${saidasHoje}</strong>
                </div>

                <div class="cartao-relatorio">
                    <h3>Total de movimentações</h3>
                    <strong>${movimentacoes.length}</strong>
                </div>

            </div>

            <div class="filtros-relatorio">

                <h3>Filtrar por período</h3>

                <label for="dataInicialRelatorio">
                    Data inicial
                </label>

                <input
                    type="date"
                    id="dataInicialRelatorio"
                >

                <label for="dataFinalRelatorio">
                    Data final
                </label>

                <input
                    type="date"
                    id="dataFinalRelatorio"
                >

                <div class="botoes-relatorio">

                    <button
                        type="button"
                        onclick="aplicarFiltrosRelatorio()"
                    >
                        Filtrar
                    </button>

                    <button
                        type="button"
                        onclick="limparFiltrosRelatorio()"
                    >
                        Limpar filtros
                    </button>

                    <button
                        type="button"
                        onclick="exportarRelatorioCSV()"
                    >
                        Exportar relatório CSV
                    </button>

                </div>

            </div>

            <div
                id="resultadoFiltroRelatorio"
                class="resultado-relatorio"
            >
                <p>
                    Selecione as datas para consultar as movimentações.
                </p>
            </div>

        </div>
    `;
}


// ==========================================
// 17. APLICAR FILTROS DOS RELATÓRIOS
// ==========================================

function aplicarFiltrosRelatorio() {
    const inicial = document.getElementById(
        "dataInicialRelatorio"
    ).value;

    const final = document.getElementById(
        "dataFinalRelatorio"
    ).value;

    const resultado = document.getElementById(
        "resultadoFiltroRelatorio"
    );

    if (!inicial || !final) {
        alert("Preencha a data inicial e a data final.");
        return;
    }

    if (inicial > final) {
        alert("A data inicial não pode ser posterior à data final.");
        return;
    }

    const filtradas = movimentacoes.filter(item =>
        item.dia >= inicial && item.dia <= final
    );

    const entradas = filtradas.filter(
        item => item.tipo === "Entrada"
    ).length;

    const saidas = filtradas.filter(
        item => item.tipo === "Saída"
    ).length;

    resultado.innerHTML = `
        <h3>Resultado do período</h3>

        <p>
            Movimentações encontradas:
            <strong>${filtradas.length}</strong>
        </p>

        <p>
            Entradas:
            <strong>${entradas}</strong>
        </p>

        <p>
            Saídas:
            <strong>${saidas}</strong>
        </p>
    `;
}


// ==========================================
// 18. LIMPAR FILTROS DOS RELATÓRIOS
// ==========================================

function limparFiltrosRelatorio() {
    const inicial = document.getElementById(
        "dataInicialRelatorio"
    );

    const final = document.getElementById(
        "dataFinalRelatorio"
    );

    const resultado = document.getElementById(
        "resultadoFiltroRelatorio"
    );

    if (!inicial || !final || !resultado) {
        return;
    }

    inicial.value = "";
    final.value = "";

    resultado.innerHTML = `
        <p>
            Selecione as datas para consultar as movimentações.
        </p>
    `;
}


// ==========================================
// 19. EXPORTAR RELATÓRIO CSV
// ==========================================

function exportarRelatorioCSV() {
    const inicial = document.getElementById(
        "dataInicialRelatorio"
    )?.value || "";

    const final = document.getElementById(
        "dataFinalRelatorio"
    )?.value || "";

    if ((inicial && !final) || (!inicial && final)) {
        alert("Preencha as duas datas ou deixe ambas vazias.");
        return;
    }

    if (inicial && final && inicial > final) {
        alert("A data inicial não pode ser posterior à data final.");
        return;
    }

    const registros = movimentacoes.filter(item => {

        if (!inicial && !final) {
            return true;
        }

        return item.dia >= inicial && item.dia <= final;

    });

    if (registros.length === 0) {
        alert("Não existem movimentações para exportar.");
        return;
    }

    const escaparCSV = valor =>
        `"${String(valor ?? "").replace(/"/g, '""')}"`;

    const linhas = [
        ["Aluno", "Turma", "Movimentação", "Data e horário"],

        ...registros.map(item => [
            item.nome,
            item.turma,
            item.tipo,
            new Date(item.dataHora).toLocaleString("pt-BR")
        ])
    ];

    const csv = "\uFEFF" + linhas
        .map(linha =>
            linha.map(escaparCSV).join(";")
        )
        .join("\n");

    const arquivo = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(arquivo);

    const link = document.createElement("a");

    link.href = url;

    link.download = "relatorio-schoolcontrol.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);

    alert("Relatório exportado com sucesso!");
}


// ==========================================
// 20. INICIALIZAÇÃO
// ==========================================

atualizarResumo();
