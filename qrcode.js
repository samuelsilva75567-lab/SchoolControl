// ==========================================
// SCHOOLCONTROL - QR CODE OFICIAL + IDENTIFICAÇÃO EM 1 SEGUNDO (CPF)
// ==========================================

const painelQrEscola = document.getElementById("painelQrEscola");
const qrcodeContainer = document.getElementById("qrcodeContainer");
const resultadoLeitura = document.getElementById("resultadoLeitura");
const mensagemResultado = document.getElementById("mensagemResultado");
const statusLeitor = document.getElementById("statusLeitor");
const badgeStatus = document.getElementById("badgeStatus");

const CHAVE_PADRAO_ESCOLA = "SCHOOLCONTROL-A30DC0FB-F9E9-467A-886D-542D9B820F67";
const TEMPO_MINIMO_ENTRE_REGISTROS_MS = 2 * 60 * 1000; // 2 minutos contra leitura dupla

// ==========================================
// 1. UTILITÁRIOS, CPF E CHAVE OFICIAL
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

function dataDeHojeLocal() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function emitirFeedbackSensorial() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([100, 50, 120]);
    }

    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
    } catch {
        // Ignora caso o navegador bloqueie áudio automático
    }
}

// ==========================================
// 2. EXIBIR O QR CODE OFICIAL NA TELA (TOTEM)
// ==========================================

function renderizarQrCodeOficial() {
    const chave = obterChaveOficialAtiva();
    const urlBase = window.location.origin + window.location.pathname;
    const linkCompleto = `${urlBase}?chave=${encodeURIComponent(chave)}`;

    qrcodeContainer.style.background = "#ffffff";
    qrcodeContainer.style.padding = "16px";
    qrcodeContainer.style.borderRadius = "14px";
    qrcodeContainer.innerHTML = "";

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
// 3. CADASTRO ÚNICO NO CELULAR (APENAS 1ª VEZ)
// ==========================================

function solicitarIdentificacaoUnica() {
    painelQrEscola.style.display = "none";
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = "#3b82f6";

    mensagemResultado.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px;">
            <span style="display: inline-block; background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid #3b82f6; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 8px;">
                Configuração Única • 1º Acesso
            </span>
            <h3 style="color: #f8fafc; font-size: 20px; margin-bottom: 6px;">
                Vincular este celular
            </h3>
            <p style="font-size: 13px; color: #94a3b8;">
                Preencha uma única vez. A partir de amanhã, basta apontar a câmera para liberar em <strong>1 segundo</strong> sem digitar nada.
            </p>
        </div>

        <div id="erroCpfCelular" style="display: none; color: #fca5a5; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; text-align: left;"></div>

        <form id="formIdentificacaoRapida" style="text-align: left;">
            <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 5px; font-weight: 600;">
                CPF do Aluno
            </label>
            <input
                type="text"
                id="alunoCpfCelular"
                inputmode="numeric"
                maxlength="14"
                placeholder="000.000.000-00"
                required
                style="width: 100%; padding: 11px; border-radius: 8px; border: 1px solid #334155; background: #080d18; color: #fff; margin-bottom: 12px; font-size: 14px;"
            >

            <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 5px; font-weight: 600;">
                Nome Completo
            </label>
            <input
                type="text"
                id="alunoNomeCelular"
                placeholder="Ex: Maria Clara Oliveira"
                required
                style="width: 100%; padding: 11px; border-radius: 8px; border: 1px solid #334155; background: #080d18; color: #fff; margin-bottom: 12px; font-size: 14px;"
            >

            <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 5px; font-weight: 600;">
                Turma
            </label>
            <input
                type="text"
                id="alunoTurmaCelular"
                placeholder="Ex: 9º ano A"
                required
                style="width: 100%; padding: 11px; border-radius: 8px; border: 1px solid #334155; background: #080d18; color: #fff; margin-bottom: 16px; font-size: 14px;"
            >

            <button type="submit" class="botao-iniciar" style="width: 100%;">
                Salvar no Celular e Liberar
            </button>
        </form>
    `;

    if (badgeStatus) badgeStatus.textContent = "1º Acesso";
    if (statusLeitor) statusLeitor.textContent = "Aguardando vinculação única do aluno.";

    const inputCpf = document.getElementById("alunoCpfCelular");
    const erroBox = document.getElementById("erroCpfCelular");

    // Formata o CPF enquanto digita e preenche nome/turma automaticamente se já estiver cadastrado no painel
    inputCpf.addEventListener("input", function () {
        inputCpf.value = formatarCPF(inputCpf.value);
        erroBox.style.display = "none";

        const cpfLimpo = limparCPF(inputCpf.value);
        if (cpfLimpo.length === 11) {
            const alunosCadastrados = JSON.parse(localStorage.getItem("schoolcontrol_alunos") || "[]");
            const encontrado = alunosCadastrados.find(a => limparCPF(a.cpf || a.matricula) === cpfLimpo);
            if (encontrado) {
                document.getElementById("alunoNomeCelular").value = encontrado.nome;
                document.getElementById("alunoTurmaCelular").value = encontrado.turma;
            }
        }
    });

    document.getElementById("formIdentificacaoRapida").addEventListener("submit", function (event) {
        event.preventDefault();

        const cpfLimpo = limparCPF(inputCpf.value);
        const cpfFormatado = formatarCPF(cpfLimpo);
        const nome = document.getElementById("alunoNomeCelular").value.trim();
        const turma = document.getElementById("alunoTurmaCelular").value.trim();

        if (!validarCPF(cpfLimpo)) {
            erroBox.textContent = "CPF inválido. Verifique os 11 números digitados.";
            erroBox.style.display = "block";
            inputCpf.focus();
            return;
        }

        if (!nome || !turma) return;

        // Sincroniza também na lista geral de alunos caso ainda não esteja lá
        const alunosCadastrados = JSON.parse(localStorage.getItem("schoolcontrol_alunos") || "[]");
        let alunoExistente = alunosCadastrados.find(a => limparCPF(a.cpf || a.matricula) === cpfLimpo);

        if (!alunoExistente) {
            alunoExistente = {
                id: crypto.randomUUID(),
                nome,
                turma,
                cpf: cpfFormatado
            };
            alunosCadastrados.push(alunoExistente);
            localStorage.setItem("schoolcontrol_alunos", JSON.stringify(alunosCadastrados));
        }

        const perfilDispositivo = {
            id: alunoExistente.id,
            nome: alunoExistente.nome,
            turma: alunoExistente.turma,
            cpf: formatarCPF(alunoExistente.cpf || cpfLimpo),
            cpfLimpo
        };

        localStorage.setItem("schoolcontrol_aluno_dispositivo", JSON.stringify(perfilDispositivo));
        liberarAcessoEmUmSegundo(perfilDispositivo);
    });
}

// ==========================================
// 4. LIBERAÇÃO INSTANTÂNEA EM 1 SEGUNDO (SEM DIGITAR)
// ==========================================

function liberarAcessoEmUmSegundo(perfilAluno) {
    const agora = new Date();
    const hoje = dataDeHojeLocal();
    const horario = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    const cpfLimpoAtual = limparCPF(perfilAluno.cpfLimpo || perfilAluno.cpf);
    const cpfFormatadoAtual = formatarCPF(cpfLimpoAtual);

    const movimentacoes = JSON.parse(
        localStorage.getItem("schoolcontrol_movimentacoes") || "[]"
    );

    const ultimaHoje = movimentacoes.find(
        m => limparCPF(m.cpfLimpo || m.cpf || m.matricula) === cpfLimpoAtual && m.dia === hoje
    );

    // Ignora leitura repetida em menos de 2 minutos para não inverter Entrada/Saída sem querer
    if (ultimaHoje) {
        const diferencaMs = agora.getTime() - new Date(ultimaHoje.dataHora).getTime();
        if (diferencaMs >= 0 && diferencaMs < TEMPO_MINIMO_ENTRE_REGISTROS_MS) {
            const horarioAnterior = new Date(ultimaHoje.dataHora).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
            });

            renderizarCartaoLiberado({
                perfilAluno: { ...perfilAluno, cpf: cpfFormatadoAtual },
                tipoMovimentacao: ultimaHoje.tipo,
                horario: horarioAnterior,
                jaRegistradoRecentemente: true
            });
            return;
        }
    }

    // Alterna automaticamente entre Entrada e Saída
    const tipoMovimentacao = ultimaHoje && ultimaHoje.tipo === "Entrada" ? "Saída" : "Entrada";

    movimentacoes.unshift({
        id: crypto.randomUUID(),
        alunoId: perfilAluno.id,
        cpf: cpfFormatadoAtual,
        cpfLimpo: cpfLimpoAtual,
        nome: perfilAluno.nome,
        turma: perfilAluno.turma,
        tipo: tipoMovimentacao,
        dataHora: agora.toISOString(),
        dia: hoje
    });

    localStorage.setItem("schoolcontrol_movimentacoes", JSON.stringify(movimentacoes));
    emitirFeedbackSensorial();

    renderizarCartaoLiberado({
        perfilAluno: { ...perfilAluno, cpf: cpfFormatadoAtual },
        tipoMovimentacao,
        horario,
        jaRegistradoRecentemente: false
    });
}

function renderizarCartaoLiberado({ perfilAluno, tipoMovimentacao, horario, jaRegistradoRecentemente }) {
    const corBorda = jaRegistradoRecentemente
        ? "#f59e0b"
        : (tipoMovimentacao === "Entrada" ? "#22c55e" : "#3b82f6");

    const corTitulo = jaRegistradoRecentemente
        ? "#fcd34d"
        : (tipoMovimentacao === "Entrada" ? "#86efac" : "#93c5fd");

    const tituloPrincipal = jaRegistradoRecentemente
        ? `✓ ${tipoMovimentacao} já registrada`
        : `✓ ${tipoMovimentacao} liberada`;

    const subtexto = jaRegistradoRecentemente
        ? `Leitura repetida ignorada. Registro feito às ${horario}.`
        : `Liberado automaticamente às ${horario}`;

    painelQrEscola.style.display = "none";
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = corBorda;

    mensagemResultado.innerHTML = `
        <div style="margin-bottom: 10px;">
            <span style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid #10b981; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.4px;">
                ⚡ IDENTIFICAÇÃO EM 1 SEGUNDO ATIVA
            </span>
        </div>

        <p style="color: ${corTitulo}; font-weight: bold; font-size: 26px; margin-bottom: 12px;">
            ${tituloPrincipal}
        </p>

        <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 14px;">
            <p style="font-size: 19px; font-weight: bold; color: #f8fafc; margin-bottom: 4px;">
                ${escaparHTML(perfilAluno.nome)}
            </p>
            <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 4px;">
                Turma: <strong>${escaparHTML(perfilAluno.turma)}</strong> • CPF: <strong>${escaparHTML(perfilAluno.cpf)}</strong>
            </p>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 6px;">
                ${subtexto}
            </p>
        </div>

        <button
            type="button"
            onclick="trocarAlunoDispositivo()"
            style="background: transparent; border: 1px solid #475569; color: #94a3b8; padding: 7px 14px; border-radius: 8px; font-size: 12px; cursor: pointer;"
        >
            Não é você? Trocar aluno
        </button>
    `;

    if (badgeStatus) badgeStatus.textContent = `${tipoMovimentacao} liberada`;
    if (statusLeitor) statusLeitor.textContent = "Celular reconhecido automaticamente.";
}

function trocarAlunoDispositivo() {
    localStorage.removeItem("schoolcontrol_aluno_dispositivo");
    solicitarIdentificacaoUnica();
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
// 5. INICIALIZAÇÃO
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

        if (alunoSalvo && alunoSalvo.nome && limparCPF(alunoSalvo.cpfLimpo || alunoSalvo.cpf).length === 11) {
            liberarAcessoEmUmSegundo(alunoSalvo);
        } else {
            solicitarIdentificacaoUnica();
        }
        return;
    }

    renderizarQrCodeOficial();
}

iniciarPaginaQr();