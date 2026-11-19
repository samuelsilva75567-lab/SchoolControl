
const botaoIniciar = document.getElementById("iniciarLeitura");
const statusLeitor = document.getElementById("statusLeitor");
const resultadoLeitura = document.getElementById("resultadoLeitura");
const mensagemResultado = document.getElementById("mensagemResultado");

let leitor = null;
let cameraAtiva = false;
let processandoLeitura = false;

function atualizarStatus(mensagem) {
    statusLeitor.textContent = mensagem;
}

function mostrarResultado(mensagem) {
    resultadoLeitura.style.display = "block";
    mensagemResultado.textContent = mensagem;
}

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
                if (processandoLeitura) return;

                processandoLeitura = true;

                mostrarResultado(
                    "QR Code lido com sucesso. Código recebido: " + codigoLido
                );

                atualizarStatus("Leitura concluída.");

                setTimeout(() => {
                    processandoLeitura = false;
                }, 3000);
            },
            () => {
                // Ignora tentativas em que nenhum QR Code foi encontrado.
            }
        );

        cameraAtiva = true;
        botaoIniciar.textContent = "Câmera iniciada";
        atualizarStatus("Câmera ativa. Aponte para um QR Code.");

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

