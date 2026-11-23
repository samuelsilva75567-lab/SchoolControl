// ==========================================
// SCHOOLCONTROL - QR CODE OFICIAL + IDENTIFICAÇÃO 1 SEGUNDO
// ==========================================

const painelQrEscola = document.getElementById("painelQrEscola");
const qrcodeContainer = document.getElementById("qrcodeContainer");
const resultadoLeitura = document.getElementById("resultadoLeitura");
const mensagemResultado = document.getElementById("mensagemResultado");
const statusLeitor = document.getElementById("statusLeitor");
const badgeStatus = document.getElementById("badgeStatus");

const CHAVE_PADRAO_ESCOLA = "SCHOOLCONTROL-A30DC0FB-F9E9-467A-886D-542D9B820F67";

// ==========================================
// 1. EXTRAIR CHAVE OFICIAL
// ==========================================

function extrairChave(texto) {
    const limpo = String(texto ?? "").trim();
    if (!limpo) return "";

    try {
        const url = new URL(limpo);
        const chaveUrl = url.searchParams.get("chave");
        if (chaveUrl) return chaveUrl.trim();
    } catch {
        // Texto direto
    }

    return limpo;
}

function obterChaveOficialAtiva() {
    const salvoNoPainel = (localStorage.getItem("schoolcontrol_qr_oficial") || "").trim();
    const chaveExtraida = extrairChave(salvoNoPainel);
    return chaveExtraida || CHAVE_PADRAO_ESCOLA;
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

// ==========================================
// 2. EXIBIR O QR CODE OFICIAL NA TELA (SEM TRAVAR)
// ==========================================

function renderizarQrCodeOficial() {
    const chave = obterChaveOficialAtiva();
    const urlBase = window.location.origin + window.location.pathname;
    const linkCompleto = `${urlBase}?chave=${encodeURIComponent(chave)}`;

    qrcodeContainer.style.background = "#ffffff";
    qrcodeContainer.style.padding = "16px";
    qrcodeContainer.style.borderRadius = "14px";
    qrcodeContainer.innerHTML = "";

    // Gera a imagem nítida do QR Code com fallback automático caso a biblioteca local não esteja carregada
    const imgQr = document.createElement("img");
    imgQr.alt = "QR Code Oficial SchoolControl";
    imgQr.width = 240;
    imgQr.height = 240;
    imgQr.style.display = "block";
    imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=4&data=${encodeURIComponent(linkCompleto)}`;

    imgQr.onerror = function () {
        qrcodeContainer.innerHTML = "";
        if (window.QRCode) {
            new QRCode(qrcodeContainer, {
                text: linkCompleto,
                width: 240,
                height: 240,
                colorDark: "#080d18",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            qrcodeContainer.innerHTML = `<p style="color:#080d18;font-size:13px;max-width:220px;word-break:break-all;">${escaparHTML(linkCompleto)}</p>`;
        }
    };

    qrcodeContainer.appendChild(imgQr);

    if (badgeStatus) badgeStatus.textContent = "QR Code ativo";
    if (statusLeitor) statusLeitor.textContent = "QR Code oficial pronto para leitura pelos alunos.";
}

// ==========================================
// 3. IDENTIFICAÇÃO RÁPIDA DO ALUNO NO CELULAR
// ==========================================

function solicitarIdentificacaoAluno() {
    painelQrEscola.style.display = "none";
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = "#3b82f6";

    mensagemResultado.innerHTML = `
        <h3 style="color: #93c5fd; font-size: 20px; margin-bottom: 6px;">
            Primeiro Acesso no Celular
        </h3>
        <p style="font-size: 14px; opacity: 0.85; margin-bottom: 16px;">
            Preencha apenas uma vez. Nos próximos dias sua entrada será liberada em 1 segundo!
        </p>

        <form id="formIdentificacaoRapida" style="text-align: left;">
            <label style="display: block; font-size: 13px; margin-bottom: 4px;">Seu Nome Completo</label>
            <input
                type="text"
                id="alunoNomeCelular"
                placeholder="Ex: João Pedro Silva"
                required
                style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #334155; background: #080d18; color: #fff; margin-bottom: 12px;"
            >

            <label style="display: block; font-size: 13px; margin-bottom: 4px;">Sua Turma</label>
            <input
                type="text"
                id="alunoTurmaCelular"
                placeholder="Ex: 9º ano B"
                required
                style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #334155; background: #080d18; color: #fff; margin-bottom: 12px;"
            >

            <label style="display: block; font-size: 13px; margin-bottom: 4px;">Matrícula</label>
            <input
                type="text"
                id="alunoMatriculaCelular"
                placeholder="Ex: 202601"
                required
                style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #334155; background: #080d18; color: #fff; margin-bottom: 16px;"
            >

            <button type="submit" class="botao-iniciar" style="width: 100%;">
                Salvar e Liberar Entrada
            </button>
        </form>
    `;

    if (badgeStatus) badgeStatus.textContent = "Identificação";
    if (statusLeitor) statusLeitor.textContent = "Aguardando identificação única do aparelho.";

    document.getElementById("formIdentificacaoRapida").addEventListener("submit", function (event) {
        event.preventDefault();

        const nome = document.getElementById("alunoNomeCelular").value.trim();
        const turma = document.getElementById("alunoTurmaCelular").value.trim();
        const matricula = document.getElementById("alunoMatriculaCelular").value.trim();

        if (!nome || !turma || !matricula) return;

        const perfilAluno = {
            id: crypto.randomUUID(),
            nome,
            turma,
            matricula
        };

        localStorage.setItem("schoolcontrol_aluno_dispositivo", JSON.stringify(perfilAluno));
        registrarELiberarAluno(perfilAluno);
    });
}

function registrarELiberarAluno(perfilAluno) {
    const agora = new Date();
    const hoje = agora.toISOString().split("T")[0];
    const horario = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    const movimentacoes = JSON.parse(
        localStorage.getItem("schoolcontrol_movimentacoes")
    ) || [];

    const ultimaHoje = movimentacoes.find(
        m => m.matricula === perfilAluno.matricula && m.dia === hoje
    );
    const tipoMovimentacao = ultimaHoje && ultimaHoje.tipo === "Entrada" ? "Saída" : "Entrada";

    movimentacoes.unshift({
        id: crypto.randomUUID(),
        alunoId: perfilAluno.id,
        matricula: perfilAluno.matricula,
        nome: perfilAluno.nome,
        turma: perfilAluno.turma,
        tipo: tipoMovimentacao,
        dataHora: agora.toISOString(),
        dia: hoje
    });

    localStorage.setItem(
        "schoolcontrol_movimentacoes",
        JSON.stringify(movimentacoes)
    );

    const corBorda = tipoMovimentacao === "Entrada" ? "#22c55e" : "#3b82f6";
    const corTitulo = tipoMovimentacao === "Entrada" ? "#86efac" : "#93c5fd";

    painelQrEscola.style.display = "none";
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = corBorda;

    mensagemResultado.innerHTML = `
        <p style="color: ${corTitulo}; font-weight: bold; font-size: 26px; margin-bottom: 8px;">
            ✓ ${tipoMovimentacao} liberada
        </p>
        <p style="font-size: 18px; font-weight: bold; color: #f8fafc; margin-bottom: 4px;">
            ${escaparHTML(perfilAluno.nome)}
        </p>
        <p style="font-size: 14px; opacity: 0.85; margin-bottom: 14px;">
            Turma: ${escaparHTML(perfilAluno.turma)} • Horário: ${horario}
        </p>
        <button
            type="button"
            onclick="trocarAlunoDispositivo()"
            style="background: transparent; border: 1px solid #475569; color: #94a3b8; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;"
        >
            Não é você? Trocar aluno
        </button>
    `;

    if (badgeStatus) badgeStatus.textContent = `${tipoMovimentacao} liberada`;
    if (statusLeitor) statusLeitor.textContent = "Registro concluído automaticamente.";
}

function trocarAlunoDispositivo() {
    localStorage.removeItem("schoolcontrol_aluno_dispositivo");
    solicitarIdentificacaoAluno();
}

function exibirQrInvalido(motivo) {
    painelQrEscola.style.display = "none";
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = "#ef4444";

    mensagemResultado.innerHTML = `
        <p style="color: #fca5a5; font-weight: bold; font-size: 22px; margin-bottom: 8px;">
            ✕ QR Code inválido
        </p>
        <p style="font-size: 14px; opacity: 0.85;">
            ${motivo}
        </p>
    `;

    if (badgeStatus) badgeStatus.textContent = "Acesso negado";
    if (statusLeitor) statusLeitor.textContent = "Código inválido ou não autorizado.";
}

// ==========================================
// 4. INICIALIZAÇÃO
// ==========================================

function iniciarPaginaQr() {
    const params = new URLSearchParams(window.location.search);
    const chaveNaUrl = params.get("chave");

    if (chaveNaUrl !== null) {
        const chaveLimpa = chaveNaUrl.trim();
        const chaveOficial = obterChaveOficialAtiva();

        if (chaveLimpa !== chaveOficial) {
            exibirQrInvalido("Este QR Code não é válido ou foi substituído.");
            return;
        }

        const alunoSalvo = JSON.parse(
            localStorage.getItem("schoolcontrol_aluno_dispositivo") || "null"
        );

        if (alunoSalvo && alunoSalvo.nome && alunoSalvo.matricula) {
            registrarELiberarAluno(alunoSalvo);
        } else {
            solicitarIdentificacaoAluno();
        }
        return;
    }

    renderizarQrCodeOficial();
}

iniciarPaginaQr();