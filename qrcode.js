// ==========================================
// SCHOOLCONTROL - LEITOR DE QR CODE OFICIAL
// ==========================================

const botaoIniciar = document.getElementById("iniciarLeitura");
const statusLeitor = document.getElementById("statusLeitor");
const resultadoLeitura = document.getElementById("resultadoLeitura");
const mensagemResultado = document.getElementById("mensagemResultado");

let leitor = null;
let cameraAtiva = false;
let bloqueioLeitura = false;

// ==========================================
// 1. VALIDAÇÃO DO QR CODE OFICIAL DA ESCOLA
// ==========================================

function validarELiberar(codigoLido) {
    if (bloqueioLeitura) return;

    bloqueioLeitura = true;

    const codigoLimpo = String(codigoLido ?? "").trim();
    const codigoOficial = (localStorage.getItem("schoolcontrol_qr_oficial") || "").trim();

    // Se o administrador ainda não cadastrou o QR Code oficial no painel
    if (!codigoOficial) {
        resultadoLeitura.style.display = "block";
        resultadoLeitura.style.borderColor = "#f59e0b";

        mensagemResultado.innerHTML = `
            <p style="color: #fcd34d; font-weight: bold; font-size: 18px; margin-bottom: 6px;">
                ⚠ QR Code oficial não configurado
            </p>
            <p style="font-size: 14px; opacity: 0.85;">
                Cadastre o QR Code da escola no painel administrativo primeiro.
            </p>
        `;

        atualizarStatus("Aguardando configuração do QR Code oficial.");
        liberarAposAtraso(3000);
        return;
    }

    // Se alguém mostrar um QR Code diferente ou falso
    if (codigoLimpo !== codigoOficial) {
        resultadoLeitura.style.display = "block";
        resultadoLeitura.style.borderColor = "#ef4444";

        mensagemResultado.innerHTML = `
            <p style="color: #fca5a5; font-weight: bold; font-size: 20px; margin-bottom: 6px;">
                ✕ QR Code inválido
            </p>
            <p style="font-size: 14px; opacity: 0.85;">
                Este código não pertence ao SchoolControl. Acesso negado.
            </p>
        `;

        atualizarStatus("Código recusado. Aponte o QR Code oficial da escola.");
        liberarAposAtraso(3000);
        return;
    }

    // Se o QR Code for exatamente o oficial cadastrado
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

    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = "#22c55e";

    mensagemResultado.innerHTML = `
        <p style="color: #86efac; font-weight: bold; font-size: 22px; margin-bottom: 6px;">
            ✓ Entrada liberada
        </p>
        <p style="font-size: 14px; opacity: 0.85;">
            Horário: ${horario}
        </p>
    `;

    atualizarStatus("Acesso liberado! Pronto para a próxima leitura.");
    liberarAposAtraso(3000);
}

function liberarAposAtraso(ms) {
    setTimeout(() => {
        bloqueioLeitura = false;
    }, ms);
}

// ==========================================
// 2. CONTROLE DA CÂMERA
// ==========================================

function atualizarStatus(mensagem) {
    statusLeitor.textContent = mensagem;
}

async function iniciarCamera() {
    if (cameraAtiva) return;

    if (!window.Html5Qrcode) {
        atualizarStatus("Erro ao carregar a biblioteca da câmera.");
        return;
    }

    botaoIniciar.disabled = true;
    atualizarStatus("Abrindo câmera...");

    try {
        leitor = new Html5Qrcode("reader");

        await leitor.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 230, height: 230 }
            },
            codigoLido => {
                validarELiberar(codigoLido);
            },
            () => {
                // Ignora quadros sem QR Code
            }
        );

        cameraAtiva = true;
        botaoIniciar.textContent = "Câmera ativa";
        atualizarStatus("Câmera ativa. Aponte o QR Code oficial.");

    } catch (erro) {
        atualizarStatus("Não foi possível acessar a câmera.");
        botaoIniciar.disabled = false;
        console.error("Erro ao iniciar câmera:", erro);
    }
}

botaoIniciar.addEventListener("click", iniciarCamera);

resultadoLeitura.style.display = "none";