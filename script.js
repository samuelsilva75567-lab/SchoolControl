// ==========================================
// SCHOOLCONTROL - PAINEL ADMINISTRATIVO EM TEMPO REAL (SUPABASE)
// ==========================================

const EMAIL_PADRAO = "admin@escola.com";
const SENHA_PADRAO = "admin123";

let telaAtualAdmin = "inicio";

function obterCredenciaisAdmin() {
    const salvo = JSON.parse(localStorage.getItem("schoolcontrol_admin_credenciais") || "null");
    if (salvo && salvo.email && salvo.senha) {
        return salvo;
    }
    return { email: EMAIL_PADRAO, senha: SENHA_PADRAO };
}

function atualizarIndicadorNuvem() {
    const badge = document.getElementById("badgeStatusNuvem");
    if (!badge) return;

    if (window.supabaseAtivo && window.supabaseClient) {
        badge.textContent = "● Sincronizado com Supabase em tempo real";
        badge.style.background = "rgba(16, 185, 129, 0.15)";
        badge.style.color = "#6ee7b7";
        badge.style.borderColor = "#10b981";
    } else {
        badge.textContent = "⚠ Modo local (configure supabase-config.js para nuvem)";
        badge.style.background = "rgba(245, 158, 11, 0.15)";
        badge.style.color = "#fcd34d";
        badge.style.borderColor = "#f59e0b";
    }
}

function verificarSessaoAdmin() {
    const logado = sessionStorage.getItem("schoolcontrol_admin_logado") === "true";
    const telaLogin = document.getElementById("telaLoginAdmin");
    const painel = document.getElementById("painelAdminPrincipal");

    if (!telaLogin || !painel) return;

    if (logado) {
        telaLogin.style.display = "none";
        painel.style.display = "block";
        atualizarIndicadorNuvem();
        atualizarResumo();
        mostrarTelaInicio();
        iniciarSincronizacaoSupabase();
    } else {
        telaLogin.style.display = "flex";
        painel.style.display = "none";
    }
}

document.getElementById("formLoginAdmin")?.addEventListener("submit", function (event) {
    event.preventDefault();

    const emailDigitado = document.getElementById("emailAdmin").value.trim().toLowerCase();
    const senhaDigitada = document.getElementById("senhaAdmin").value;
    const erroBox = document.getElementById("erroLoginAdmin");

    const credenciais = obterCredenciaisAdmin();

    if (emailDigitado === credenciais.email.toLowerCase() && senhaDigitada === credenciais.senha) {
        erroBox.style.display = "none";
        sessionStorage.setItem("schoolcontrol_admin_logado", "true");
        verificarSessaoAdmin();
    } else {
        erroBox.style.display = "block";
    }
});

function sairDoPainel() {
    sessionStorage.removeItem("schoolcontrol_admin_logado");
    document.getElementById("senhaAdmin").value = "";
    verificarSessaoAdmin();
}

function abrirPaginaQrCode() {
    const urlBase = window.location.href.replace(/index\.html.*$/, "").replace(/\/$/, "");
    window.open(`${urlBase}/qrcode.html`, "_blank");
}


// ==========================================
// MODAL: MUDAR SENHA DE ADMIN (COM SENHA ANTIGA)
// ==========================================

function abrirModalMudarSenha() {
    const modal = document.getElementById("modalMudarSenha");
    const formAntiga = document.getElementById("formVerificarSenhaAntiga");
    const formNova = document.getElementById("formDefinirNovaSenha");
    const erroModal = document.getElementById("erroModalSenha");
    const subtitulo = document.getElementById("subtituloModalSenha");

    if (!modal) return;

    erroModal.style.display = "none";
    erroModal.textContent = "";
    subtitulo.textContent = "Confirme sua senha antiga para liberar a alteração.";

    document.getElementById("senhaAntigaInput").value = "";
    document.getElementById("novaSenhaModal").value = "";
    document.getElementById("confirmarNovaSenhaModal").value = "";

    formAntiga.style.display = "block";
    formNova.style.display = "none";
    modal.style.display = "flex";
    document.getElementById("senhaAntigaInput").focus();
}

function fecharModalMudarSenha() {
    const modal = document.getElementById("modalMudarSenha");
    if (modal) modal.style.display = "none";
}

document.getElementById("formVerificarSenhaAntiga")?.addEventListener("submit", function (event) {
    event.preventDefault();

    const senhaDigitada = document.getElementById("senhaAntigaInput").value;
    const erroModal = document.getElementById("erroModalSenha");
    const credenciais = obterCredenciaisAdmin();

    if (senhaDigitada !== credenciais.senha) {
        erroModal.textContent = "Senha antiga incorreta. Tente novamente.";
        erroModal.style.display = "block";
        return;
    }

    erroModal.style.display = "none";
    document.getElementById("subtituloModalSenha").textContent = "Senha verificada! Preencha os novos dados abaixo.";
    document.getElementById("novoEmailModal").value = credenciais.email;

    document.getElementById("formVerificarSenhaAntiga").style.display = "none";
    document.getElementById("formDefinirNovaSenha").style.display = "block";
    document.getElementById("novaSenhaModal").focus();
});

document.getElementById("formDefinirNovaSenha")?.addEventListener("submit", function (event) {
    event.preventDefault();

    const novoEmail = document.getElementById("novoEmailModal").value.trim();
    const novaSenha = document.getElementById("novaSenhaModal").value;
    const confirmarSenha = document.getElementById("confirmarNovaSenhaModal").value;
    const erroModal = document.getElementById("erroModalSenha");

    if (!novoEmail || !novaSenha) {
        erroModal.textContent = "Preencha o e-mail e a nova senha.";
        erroModal.style.display = "block";
        return;
    }

    if (novaSenha !== confirmarSenha) {
        erroModal.textContent = "A nova senha e a confirmação não coincidem.";
        erroModal.style.display = "block";
        return;
    }

    localStorage.setItem(
        "schoolcontrol_admin_credenciais",
        JSON.stringify({ email: novoEmail, senha: novaSenha })
    );

    fecharModalMudarSenha();
    alert("Senha de administrador alterada com sucesso!");
});


// ==========================================
// 1. DADOS DOS ALUNOS, CPF E MOVIMENTAÇÕES + TEMPO REAL
// ==========================================

let alunos = [];
let movimentacoes = [];
let realtimeSupabaseIniciado = false;

try {
    alunos = JSON.parse(localStorage.getItem("schoolcontrol_alunos")) || [];
    movimentacoes = JSON.parse(localStorage.getItem("schoolcontrol_movimentacoes")) || [];
} catch {
    alunos = [];
    movimentacoes = [];
}

async function carregarDadosSupabase() {
    if (!window.supabaseAtivo || !window.supabaseClient) return;

    try {
        const [resAlunos, resMovs, resConfig] = await Promise.all([
            window.supabaseClient.from("sc_alunos").select("*"),
            window.supabaseClient.from("sc_movimentacoes").select("*").order("data_hora", { ascending: false }),
            window.supabaseClient.from("sc_config").select("*").eq("chave", "qr_oficial").maybeSingle()
        ]);

        if (Array.isArray(resAlunos.data)) {
            alunos = resAlunos.data.map(a => ({
                id: a.id,
                nome: a.nome,
                turma: a.turma,
                cpf: a.cpf,
                cpfLimpo: a.cpf_limpo
            }));
            salvarAlunosLocal();
        }

        if (Array.isArray(resMovs.data)) {
            movimentacoes = resMovs.data.map(m => ({
                id: m.id,
                alunoId: m.aluno_id,
                cpf: m.cpf,
                cpfLimpo: m.cpf_limpo,
                nome: m.nome,
                turma: m.turma,
                tipo: m.tipo,
                dataHora: m.data_hora,
                dia: m.dia
            }));
            salvarMovimentacoesLocal();
        }

        if (resConfig.data && resConfig.data.valor) {
            localStorage.setItem("schoolcontrol_qr_oficial", resConfig.data.valor);
            const inputQr = document.getElementById("inputQrOficial");
            if (inputQr && !inputQr.value) inputQr.value = resConfig.data.valor;
        }

        atualizarResumo();
        if (telaAtualAdmin === "alunos") atualizarListaAlunos();
        if (telaAtualAdmin === "entrada") mostrarTelaMovimentacao();
        if (telaAtualAdmin === "historico") filtrarHistorico();
        if (telaAtualAdmin === "relatorios") mostrarRelatorios();
    } catch (erro) {
        console.error("Erro ao carregar dados do Supabase:", erro);
    }
}

function iniciarSincronizacaoSupabase() {
    if (!window.supabaseAtivo || !window.supabaseClient || realtimeSupabaseIniciado) return;
    realtimeSupabaseIniciado = true;

    carregarDadosSupabase();

    // Escuta alterações em tempo real vindas dos celulares dos alunos
    window.supabaseClient
        .channel("schoolcontrol-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "sc_alunos" }, () => {
            carregarDadosSupabase();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "sc_movimentacoes" }, () => {
            carregarDadosSupabase();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "sc_config" }, () => {
            carregarDadosSupabase();
        })
        .subscribe();
}

function salvarAlunosLocal() {
    localStorage.setItem("schoolcontrol_alunos", JSON.stringify(alunos));
}

function salvarMovimentacoesLocal() {
    localStorage.setItem("schoolcontrol_movimentacoes", JSON.stringify(movimentacoes));
}

function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, letra => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[letra]);
}

function limparCPF(valor) {
    return String(valor ?? "").replace(/\D/g, "").slice(0, 11);
}

function formatarCPF(valor) {
    const digitos = limparCPF(valor);
    return digitos
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function validarCPF(cpf) {
    const limpo = limparCPF(cpf);
    if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(limpo.charAt(i), 10) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.charAt(9), 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(limpo.charAt(i), 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(limpo.charAt(10), 10);
}

function dataDeHoje() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}


// ==========================================
// 2. ATUALIZAR CONTADORES
// ==========================================

function atualizarResumo() {
    const totalAlunos = document.getElementById("totalAlunos");
    const totalEntradas = document.getElementById("totalEntradas");
    const totalSaidas = document.getElementById("totalSaidas");

    const hoje = dataDeHoje();
    const registrosHoje = movimentacoes.filter(item => item.dia === hoje);

    if (totalAlunos) totalAlunos.textContent = alunos.length;
    if (totalEntradas) totalEntradas.textContent = registrosHoje.filter(item => item.tipo === "Entrada").length;
    if (totalSaidas) totalSaidas.textContent = registrosHoje.filter(item => item.tipo === "Saída").length;
}


// ==========================================
// 3. NAVEGAÇÃO
// ==========================================

function abrirTela(tela) {
    telaAtualAdmin = tela;
    const area = document.getElementById("areaConteudo");
    if (!area) return;

    if (tela === "inicio") mostrarTelaInicio();
    else if (tela === "alunos") mostrarTelaAlunos();
    else if (tela === "entrada") mostrarTelaMovimentacao();
    else if (tela === "historico") mostrarHistorico();
    else if (tela === "relatorios") mostrarRelatorios();
}


// ==========================================
// 4. TELA INICIAL (QR CODE OFICIAL)
// ==========================================

function mostrarTelaInicio() {
    telaAtualAdmin = "inicio";
    const area = document.getElementById("areaConteudo");
    if (!area) return;

    const codigoAtual = localStorage.getItem("schoolcontrol_qr_oficial") || "";

    area.innerHTML = `
        <h2>Bem-vindo ao SchoolControl!</h2>
        <p>Gerencie o QR Code da portaria, alunos e registros de acesso.</p>

        <div class="painel-movimentacao" style="margin-top: 20px;">
            <h3>QR Code Oficial da Escola</h3>
            <p>
                Gere ou cole o link oficial do QR Code da portaria.
                Use o botão verde no topo para abrir a tela do QR Code em outra aba.
            </p>

            <form id="formQrOficial" style="margin-top: 14px;">
                <label for="inputQrOficial">Link / Conteúdo do QR Code Oficial</label>
                <input
                    type="text"
                    id="inputQrOficial"
                    value="${escaparHTML(codigoAtual)}"
                    placeholder="Clique em Gerar Novo QR Code"
                    required
                >

                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <button type="button" onclick="gerarCodigoAleatorioQR()">
                        Gerar Novo QR Code
                    </button>

                    <button type="submit">
                        Salvar QR Code Oficial
                    </button>
                </div>
            </form>

            <p id="statusQrOficial" style="margin-top: 12px; font-weight: bold; color: #60a5fa;">
                ${codigoAtual ? "✓ QR Code oficial configurado e ativo." : "⚠ Usando QR Code padrão até você salvar um novo."}
            </p>
        </div>
    `;

    document.getElementById("formQrOficial").addEventListener("submit", async function (event) {
        event.preventDefault();
        const valor = document.getElementById("inputQrOficial").value.trim();
        if (!valor) return;

        localStorage.setItem("schoolcontrol_qr_oficial", valor);

        if (window.supabaseAtivo && window.supabaseClient) {
            try {
                await window.supabaseClient.from("sc_config").upsert({
                    chave: "qr_oficial",
                    valor
                });
            } catch (erro) {
                console.error("Erro ao salvar QR Code no Supabase:", erro);
            }
        }

        document.getElementById("statusQrOficial").textContent =
            "✓ QR Code oficial salvo e sincronizado!";
        alert("QR Code oficial atualizado!");
    });
}

function gerarCodigoAleatorioQR() {
    const campo = document.getElementById("inputQrOficial");
    if (!campo) return;

    const chaveSecreta = "SCHOOLCONTROL-" + crypto.randomUUID().toUpperCase();
    const urlBase = window.location.href.replace(/index\.html.*$/, "").replace(/\/$/, "");
    campo.value = `${urlBase}/qrcode.html?chave=${chaveSecreta}`;
}


// ==========================================
// 5. TELA DE ALUNOS (COM CPF)
// ==========================================

function mostrarTelaAlunos() {
    telaAtualAdmin = "alunos";
    const area = document.getElementById("areaConteudo");

    area.innerHTML = `
        <h2>Gestão de Alunos</h2>
        <p>Cadastre e consulte os alunos pelo CPF.</p>

        <form id="formAluno">
            <label>Nome do aluno</label>
            <input type="text" id="nomeAluno" placeholder="Digite o nome" required>

            <label>Turma</label>
            <input type="text" id="turmaAluno" placeholder="Ex: 8º ano A" required>

            <label>CPF</label>
            <input type="text" id="cpfAluno" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" required>

            <button type="submit">Cadastrar aluno</button>
        </form>

        <h3>Alunos cadastrados</h3>
        <div id="listaAlunos"></div>
    `;

    const inputCpf = document.getElementById("cpfAluno");
    inputCpf.addEventListener("input", function () {
        inputCpf.value = formatarCPF(inputCpf.value);
    });

    document.getElementById("formAluno").addEventListener("submit", cadastrarAluno);
    atualizarListaAlunos();
}

async function cadastrarAluno(event) {
    event.preventDefault();

    const nome = document.getElementById("nomeAluno").value.trim();
    const turma = document.getElementById("turmaAluno").value.trim();
    const cpfLimpo = limparCPF(document.getElementById("cpfAluno").value);
    const cpfFormatado = formatarCPF(cpfLimpo);

    if (!nome || !turma || !cpfLimpo) {
        alert("Preencha todos os campos.");
        return;
    }

    if (!validarCPF(cpfLimpo)) {
        alert("CPF inválido. Verifique os 11 números digitados.");
        return;
    }

    if (alunos.some(aluno => limparCPF(aluno.cpf || aluno.cpfLimpo || aluno.matricula) === cpfLimpo)) {
        alert("Esse CPF já está cadastrado.");
        return;
    }

    const novoAluno = {
        id: crypto.randomUUID(),
        nome,
        turma,
        cpf: cpfFormatado,
        cpfLimpo
    };

    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            await window.supabaseClient.from("sc_alunos").insert({
                cpf_limpo: cpfLimpo,
                id: novoAluno.id,
                nome: novoAluno.nome,
                turma: novoAluno.turma,
                cpf: novoAluno.cpf
            });
            await carregarDadosSupabase();
        } catch (erro) {
            console.error("Erro ao cadastrar aluno no Supabase:", erro);
        }
    } else {
        alunos.push(novoAluno);
        salvarAlunosLocal();
        atualizarResumo();
    }

    mostrarTelaAlunos();
    alert("Aluno cadastrado com sucesso!");
}

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
            <p>CPF: ${escaparHTML(aluno.cpf || aluno.matricula || "Não informado")}</p>
        </div>
    `).join("");
}


// ==========================================
// 6. TELA DE ENTRADA E SAÍDA MANUAL
// ==========================================

function mostrarTelaMovimentacao() {
    telaAtualAdmin = "entrada";
    const area = document.getElementById("areaConteudo");

    const opcoes = alunos.map(aluno => `
        <option value="${escaparHTML(aluno.id)}">
            ${escaparHTML(aluno.nome)} - ${escaparHTML(aluno.turma)}
        </option>
    `).join("");

    area.innerHTML = `
        <div class="cabecalho-movimentacao">
            <h2>Controle de Entrada e Saída</h2>
            <p>Selecione um aluno para registrar sua movimentação manualmente.</p>
        </div>

        <div class="painel-movimentacao">
            <form id="formMovimentacao" class="form-movimentacao">
                <div class="campo-aluno">
                    <label for="alunoMovimentacao">Selecionar aluno</label>
                    <select id="alunoMovimentacao" required>
                        <option value="">Escolha um aluno</option>
                        ${opcoes}
                    </select>
                </div>

                <div class="botoes-movimentacao">
                    <button type="submit" name="tipo" value="Entrada" class="botao-entrada" ${alunos.length === 0 ? "disabled" : ""}>
                        Registrar Entrada
                    </button>
                    <button type="submit" name="tipo" value="Saída" class="botao-saida" ${alunos.length === 0 ? "disabled" : ""}>
                        Registrar Saída
                    </button>
                </div>
            </form>
        </div>

        <div class="area-recentes">
            <h3>Movimentações Recentes</h3>
            <div id="movimentacoesRecentes"></div>
        </div>
    `;

    document.getElementById("formMovimentacao").addEventListener("submit", registrarMovimentacao);
    mostrarMovimentacoesRecentes();
}

async function registrarMovimentacao(event) {
    event.preventDefault();
    const tipo = event.submitter?.value;
    const alunoId = document.getElementById("alunoMovimentacao").value;
    const aluno = alunos.find(item => item.id === alunoId);

    if (!aluno || (tipo !== "Entrada" && tipo !== "Saída")) {
        alert("Selecione um aluno válido.");
        return;
    }

    const agora = new Date();
    const hoje = dataDeHoje();
    const cpfLimpo = limparCPF(aluno.cpf || aluno.cpfLimpo);
    const chaveId = cpfLimpo ? `${hoje}_${cpfLimpo}_${tipo}` : crypto.randomUUID();

    const novoRegistro = {
        id: chaveId,
        alunoId: aluno.id,
        cpf: aluno.cpf || "",
        cpfLimpo,
        nome: aluno.nome,
        turma: aluno.turma,
        tipo,
        dataHora: agora.toISOString(),
        dia: hoje
    };

    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            await window.supabaseClient.from("sc_movimentacoes").upsert({
                id: novoRegistro.id,
                aluno_id: novoRegistro.alunoId,
                cpf: novoRegistro.cpf,
                cpf_limpo: novoRegistro.cpfLimpo,
                nome: novoRegistro.nome,
                turma: novoRegistro.turma,
                tipo: novoRegistro.tipo,
                data_hora: novoRegistro.dataHora,
                dia: novoRegistro.dia
            });
            await carregarDadosSupabase();
        } catch (erro) {
            console.error("Erro ao registrar movimentação no Supabase:", erro);
        }
    } else {
        movimentacoes.unshift(novoRegistro);
        salvarMovimentacoesLocal();
        atualizarResumo();
        mostrarTelaMovimentacao();
    }

    alert(`${tipo} registrada com sucesso!`);
}

function mostrarMovimentacoesRecentes() {
    const lista = document.getElementById("movimentacoesRecentes");
    if (!lista) return;

    const recentes = movimentacoes.slice(0, 10);
    if (recentes.length === 0) {
        lista.innerHTML = "<p>Nenhuma movimentação registrada.</p>";
        return;
    }

    lista.innerHTML = recentes.map(item => `
        <div class="aluno-item">
            <strong>${escaparHTML(item.nome)}</strong>
            <p>Turma: ${escaparHTML(item.turma)}</p>
            <p>Tipo: ${escaparHTML(item.tipo)}</p>
            <p>Data e horário: ${new Date(item.dataHora).toLocaleString("pt-BR")}</p>
        </div>
    `).join("");
}


// ==========================================
// 7. HISTÓRICO E RELATÓRIOS
// ==========================================

function mostrarHistorico() {
    telaAtualAdmin = "historico";
    const area = document.getElementById("areaConteudo");

    area.innerHTML = `
        <div class="cabecalho-historico">
            <h2>Histórico de Movimentações</h2>
            <p>Consulte todas as entradas e saídas dos alunos em tempo real.</p>
        </div>

        <div class="painel-historico">
            <div class="topo-historico">
                <h3>Registros realizados</h3>
                <span class="total-registros" id="totalHistorico">${movimentacoes.length} registros</span>
            </div>

            <input type="text" id="pesquisaHistorico" placeholder="Pesquisar aluno pelo nome..." oninput="filtrarHistorico()">

            <select id="filtroTipoHistorico" onchange="filtrarHistorico()">
                <option value="">Todas as movimentações</option>
                <option value="Entrada">Somente entradas</option>
                <option value="Saída">Somente saídas</option>
            </select>

            <button type="button" onclick="limparHistorico()">Limpar histórico</button>

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

function filtrarHistorico() {
    const campoPesquisa = document.getElementById("pesquisaHistorico");
    const campoTipo = document.getElementById("filtroTipoHistorico");
    const corpo = document.getElementById("corpoHistorico");
    const total = document.getElementById("totalHistorico");

    if (!campoPesquisa || !campoTipo || !corpo || !total) return;

    const pesquisa = campoPesquisa.value.toLowerCase().trim();
    const tipo = campoTipo.value;

    const filtradas = movimentacoes.filter(item => {
        const nomeCombina = item.nome.toLowerCase().includes(pesquisa);
        const tipoCombina = tipo === "" || item.tipo === tipo;
        return nomeCombina && tipoCombina;
    });

    total.textContent = `${filtradas.length} registros`;

    if (filtradas.length === 0) {
        corpo.innerHTML = `<tr><td colspan="4" class="historico-vazio">Nenhuma movimentação encontrada.</td></tr>`;
        return;
    }

    corpo.innerHTML = filtradas.map(item => `
        <tr>
            <td>${escaparHTML(item.nome)}</td>
            <td>${escaparHTML(item.turma)}</td>
            <td>
                <span class="status-movimentacao ${item.tipo === "Entrada" ? "status-entrada" : "status-saida"}">
                    ${escaparHTML(item.tipo)}
                </span>
            </td>
            <td>${new Date(item.dataHora).toLocaleString("pt-BR")}</td>
        </tr>
    `).join("");
}

async function limparHistorico() {
    if (movimentacoes.length === 0) {
        alert("O histórico já está vazio.");
        return;
    }
    if (!confirm("Tem certeza que deseja apagar todo o histórico na nuvem e localmente?")) return;

    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            await window.supabaseClient.from("sc_movimentacoes").delete().not("id", "is", null);
        } catch (erro) {
            console.error("Erro ao limpar histórico no Supabase:", erro);
        }
    }

    movimentacoes = [];
    salvarMovimentacoesLocal();
    filtrarHistorico();
    atualizarResumo();
    alert("Histórico apagado com sucesso!");
}

function mostrarRelatorios() {
    telaAtualAdmin = "relatorios";
    const area = document.getElementById("areaConteudo");
    const hoje = dataDeHoje();
    const registrosHoje = movimentacoes.filter(item => item.dia === hoje);
    const entradasHoje = registrosHoje.filter(item => item.tipo === "Entrada").length;
    const saidasHoje = registrosHoje.filter(item => item.tipo === "Saída").length;

    area.innerHTML = `
        <div class="cabecalho-relatorios">
            <h2>Relatórios Escolares</h2>
            <p>Consulte e exporte as movimentações do SchoolControl.</p>
        </div>

        <div class="painel-relatorios">
            <div class="cartoes-relatorios">
                <div class="cartao-relatorio"><h3>Alunos cadastrados</h3><strong>${alunos.length}</strong></div>
                <div class="cartao-relatorio"><h3>Entradas de hoje</h3><strong>${entradasHoje}</strong></div>
                <div class="cartao-relatorio"><h3>Saídas de hoje</h3><strong>${saidasHoje}</strong></div>
                <div class="cartao-relatorio"><h3>Total de movimentações</h3><strong>${movimentacoes.length}</strong></div>
            </div>

            <div class="filtros-relatorio">
                <h3>Filtrar por período</h3>
                <label for="dataInicialRelatorio">Data inicial</label>
                <input type="date" id="dataInicialRelatorio">
                <label for="dataFinalRelatorio">Data final</label>
                <input type="date" id="dataFinalRelatorio">

                <div class="botoes-relatorio">
                    <button type="button" onclick="aplicarFiltrosRelatorio()">Filtrar</button>
                    <button type="button" onclick="limparFiltrosRelatorio()">Limpar filtros</button>
                    <button type="button" onclick="exportarRelatorioCSV()">Exportar relatório CSV</button>
                </div>
            </div>

            <div id="resultadoFiltroRelatorio" class="resultado-relatorio">
                <p>Selecione as datas para consultar as movimentações.</p>
            </div>
        </div>
    `;
}

function aplicarFiltrosRelatorio() {
    const inicial = document.getElementById("dataInicialRelatorio").value;
    const final = document.getElementById("dataFinalRelatorio").value;
    const resultado = document.getElementById("resultadoFiltroRelatorio");

    if (!inicial || !final || inicial > final) {
        alert("Verifique as datas informadas.");
        return;
    }

    const filtradas = movimentacoes.filter(item => item.dia >= inicial && item.dia <= final);
    const entradas = filtradas.filter(item => item.tipo === "Entrada").length;
    const saidas = filtradas.filter(item => item.tipo === "Saída").length;

    resultado.innerHTML = `
        <h3>Resultado do período</h3>
        <p>Movimentações encontradas: <strong>${filtradas.length}</strong></p>
        <p>Entradas: <strong>${entradas}</strong></p>
        <p>Saídas: <strong>${saidas}</strong></p>
    `;
}

function limparFiltrosRelatorio() {
    document.getElementById("dataInicialRelatorio").value = "";
    document.getElementById("dataFinalRelatorio").value = "";
    document.getElementById("resultadoFiltroRelatorio").innerHTML = "<p>Selecione as datas para consultar as movimentações.</p>";
}

function exportarRelatorioCSV() {
    const inicial = document.getElementById("dataInicialRelatorio")?.value || "";
    const final = document.getElementById("dataFinalRelatorio")?.value || "";

    const registros = movimentacoes.filter(item => {
        if (!inicial && !final) return true;
        return item.dia >= inicial && item.dia <= final;
    });

    if (registros.length === 0) {
        alert("Não existem movimentações para exportar.");
        return;
    }

    const escaparCSV = valor => `"${String(valor ?? "").replace(/"/g, '""')}"`;
    const linhas = [
        ["Aluno", "CPF", "Turma", "Movimentação", "Data e horário"],
        ...registros.map(item => [
            item.nome,
            item.cpf || "",
            item.turma,
            item.tipo,
            new Date(item.dataHora).toLocaleString("pt-BR")
        ])
    ];

    const csv = "\uFEFF" + linhas.map(l => l.map(escaparCSV).join(";")).join("\n");
    const arquivo = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio-schoolcontrol.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
}


// ==========================================
// 8. INICIALIZAÇÃO
// ==========================================

verificarSessaoAdmin();