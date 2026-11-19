// ==========================================
// SCHOOLCONTROL - LEITOR DE QR CODE
// ==========================================

const botaoIniciar = document.getElementById("iniciarLeitura");
const statusLeitor = document.getElementById("statusLeitor");
const resultadoLeitura = document.getElementById("resultadoLeitura");
const mensagemResultado = document.getElementById("mensagemResultado");

let leitor = null;
let cameraAtiva = false;
let processandoLeitura = false;
let ultimoCodigoLido = null;
let tempoUltimaLeitura = 0;

// ==========================================
// 1. UTILITÁRIOS DE SEGURANÇA E DATA
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

function dataDeHoje() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

// ==========================================
// 2. ACESSO AOS DADOS (PROTOTIPAGEM LOCAL)
// ==========================================

function carregarAlunos() {
    try {
        return JSON.parse(localStorage.getItem("schoolcontrol_alunos")) || [];
    } catch (erro) {
        return [];
    }
}

function carregarMovimentacoes() {
    try {
        return JSON.parse(localStorage.getItem("schoolcontrol_movimentacoes")) || [];
    } catch (erro) {
        return [];
    }
}

function salvarMovimentacoes(movimentacoes) {
    localStorage.setItem(
        "schoolcontrol_movimentacoes",
        JSON.stringify(movimentacoes)
    );
}

// ==========================================
// 3. LÓGICA DE IDENTIFICAÇÃO E REGISTRO
// ==========================================

function determinarTipoMovimentacao(alunoId, movimentacoes) {
    const hoje = dataDeHoje();

    const ultimaHoje = movimentacoes.find(
        item => item.alunoId === alunoId && item.dia === hoje
    );

    if (!ultimaHoje || ultimaHoje.tipo === "Saída") {
        return "Entrada";
    }

    return "Saída";
}

function processarCodigoQR(codigoLido) {
    const codigoLimpo = String(codigoLido ?? "").trim();
    const agoraMs = Date.now();

    if (
        processandoLeitura ||
        (codigoLimpo === ultimoCodigoLido && agoraMs - tempoUltimaLeitura < 5000)
    ) {
        return;
    }

    processandoLeitura = true;
    ultimoCodigoLido = codigoLimpo;
    tempoUltimaLeitura = agoraMs;

    const alunos = carregarAlunos();
    const aluno = alunos.find(item => item.id === codigoLimpo);

    if (!aluno) {
        exibirCartaoErro(
            "QR Code não reconhecido",
            "Nenhum aluno cadastrado corresponde a este código."
        );
        atualizarStatus("Código inválido. Aguardando nova leitura...");
        liberarLeituraAposAtraso(3000);
        return;
    }

    const movimentacoes = carregarMovimentacoes();
    const tipo = determinarTipoMovimentacao(aluno.id, movimentacoes);
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

    salvarMovimentacoes(movimentacoes);

    exibirCartaoConfirmacao(aluno, tipo, agora);
    atualizarStatus(`${tipo} registrada com sucesso! Pronto para o próximo aluno.`);

    liberarLeituraAposAtraso(3500);
}

function liberarLeituraAposAtraso(ms) {
    setTimeout(() => {
        processandoLeitura = false;
    }, ms);
}

// ==========================================
// 4. INTERFACE E FEEDBACK VISUAL
// ==========================================

function atualizarStatus(mensagem) {
    statusLeitor.textContent = mensagem;
}

function exibirCartaoConfirmacao(aluno, tipo, dataHora) {
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = tipo === "Entrada" ? "#22c55e" : "#f59e0b";

    const corDestaque = tipo === "Entrada" ? "#86efac" : "#fcd34d";
    const horarioFormatado = dataHora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    mensagemResultado.innerHTML = `
        <p style="color: ${corDestaque}; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
            ✓ ${escaparHTML(tipo)} confirmada
        </p>
        <p><strong>Aluno:</strong> ${escaparHTML(aluno.nome)}</p>
        <p><strong>Turma:</strong> ${escaparHTML(aluno.turma)}</p>
        <p><strong>Horário:</strong> ${escaparHTML(horarioFormatado)}</p>
    `;
}

function exibirCartaoErro(titulo, detalhe) {
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = "#ef4444";

    mensagemResultado.innerHTML = `
        <p style="color: #fca5a5; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
            ✕ ${escaparHTML(titulo)}
        </p>
        <p>${escaparHTML(detalhe)}</p>
    `;
}

// ==========================================
// 5. CONTROLE DA CÂMERA
// ==========================================

async function iniciarCamera() {
    if (cameraAtiva) return;

    if (!window.Html5Qrcode) {
        atualizarStatus("Não foi possível carregar a biblioteca de leitura.");
        return;
    }

    botaoIniciar.disabled = true;
    atualizarStatus("Solicitando acesso à câmera...");

    try {
        leitor = new Html5Qrcode("reader");

        await leitor.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 230, height: 230 }
            },
            codigoLido => {
                processarCodigoQR(codigoLido);
            },
            () => {
                // Ignora quadros sem QR Code detectado
            }
        );

        cameraAtiva = true;
        botaoIniciar.textContent = "Câmera ativa";
        atualizarStatus("Câmera ativa. Aponte o QR Code do aluno.");

    } catch (erro) {
        atualizarStatus(
            "Não foi possível iniciar a câmera. Verifique a permissão do navegador."
        );

        botaoIniciar.disabled = false;
        console.error("Erro ao iniciar câmera:", erro);
    }
}

botaoIniciar.addEventListener("click", iniciarCamera);

resultadoLeitura.style.display = "none";