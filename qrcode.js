// ==========================================
// SCHOOLCONTROL - EXIBIÇÃO E VALIDAÇÃO DO QR CODE OFICIAL
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
        // Não é uma URL, retorna texto direto
    }

    return limpo;
}

function obterChaveOficialAtiva() {
    const salvoNoPainel = (localStorage.getItem("schoolcontrol_qr_oficial") || "").trim();
    const chaveExtraida = extrairChave(salvoNoPainel);
    return chaveExtraida || CHAVE_PADRAO_ESCOLA;
}

// ==========================================
// 2. EXIBIR O QR CODE OFICIAL NA TELA
// ==========================================

function renderizarQrCodeOficial() {
    const chave = obterChaveOficialAtiva();
    const urlBase = window.location.origin + window.location.pathname;
    const linkCompleto = `${urlBase}?chave=${encodeURIComponent(chave)}`;

    if (!window.QRCode) {
        qrcodeContainer.style.background = "transparent";
        qrcodeContainer.innerHTML = `
            <p style="color: #fca5a5; font-weight: bold;">
                Erro ao carregar o gerador de QR Code. Recarregue a página.
            </p>
        `;
        return;
    }

    qrcodeContainer.innerHTML = "";

    new QRCode(qrcodeContainer, {
        text: linkCompleto,
        width: 240,
        height: 240,
        colorDark: "#080d18",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    if (badgeStatus) badgeStatus.textContent = "QR Code ativo";
    if (statusLeitor) statusLeitor.textContent = "QR Code oficial pronto para leitura pelos alunos.";
}

// ==========================================
// 3. VALIDAR QUANDO O ALUNO ESCANEIA COM O CELULAR
// ==========================================

function exibirEntradaLiberada() {
    const agora = new Date();
    const horario = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    const movimentacoes = JSON.parse(
        localStorage.getItem("schoolcontrol_movimentacoes")
    ) || [];

    movimentacoes.unshift({
        id: crypto.randomUUID(),
        alunoId: "qr-oficial",
        nome: "Acesso via QR Code Oficial",
        turma: "Portaria",
        tipo: "Entrada",
        dataHora: agora.toISOString(),
        dia: agora.toISOString().split("T")[0]
    });

    localStorage.setItem(
        "schoolcontrol_movimentacoes",
        JSON.stringify(movimentacoes)
    );

    painelQrEscola.style.display = "none";
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = "#22c55e";

    mensagemResultado.innerHTML = `
        <p style="color: #86efac; font-weight: bold; font-size: 26px; margin-bottom: 8px;">
            ✓ Entrada liberada
        </p>
        <p style="font-size: 15px; opacity: 0.9;">
            Horário: ${horario}
        </p>
    `;

    if (badgeStatus) badgeStatus.textContent = "Acesso liberado";
    if (statusLeitor) statusLeitor.textContent = "Registro concluído com sucesso.";
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

        if (chaveLimpa === chaveOficial) {
            exibirEntradaLiberada();
        } else {
            exibirQrInvalido("Este QR Code não é válido ou foi substituído.");
        }
        return;
    }

    renderizarQrCodeOficial();
}

iniciarPaginaQr();