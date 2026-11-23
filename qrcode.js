// ==========================================
// SCHOOLCONTROL - QR CODE OFICIAL + SUPABASE + IDENTIFICAÇÃO 1 SEGUNDO
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
// 1. UTILITÁRIOS, VALIDAÇÃO OFICIAL DE CPF E CHAVE
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

async function obterChaveOficialAtiva() {
    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient
                .from("sc_config")
                .select("valor")
                .eq("chave", "qr_oficial")
                .maybeSingle();

            if (data && data.valor) {
                localStorage.setItem("schoolcontrol_qr_oficial", data.valor);
                const extraida = extrairChave(data.valor);
                if (extraida) return extraida;
            }
        } catch (erro) {
            console.warn("Falha ao buscar chave oficial no Supabase:", erro);
        }
    }

    const salvoLocal = (localStorage.getItem("schoolcontrol_qr_oficial") || "").trim();
    return extrairChave(salvoLocal) || CHAVE_PADRAO_ESCOLA;
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
    if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) {
        return false;
    }

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(limpo.charAt(i), 10) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.charAt(9), 10)) {
        return false;
    }

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

function formatarHoraCurta(dataIso) {
    return new Date(dataIso).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
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
        // Ignora bloqueio de áudio
    }
}

// ==========================================
// 2. DESENHO INSTANTÂNEO DO QR CODE NA TELA
// ==========================================

function desenharCanvasOuImagemQR(linkCompleto) {
    if (!qrcodeContainer) return;

    qrcodeContainer.style.background = "#ffffff";
    qrcodeContainer.style.padding = "16px";
    qrcodeContainer.style.borderRadius = "14px";
    qrcodeContainer.style.display = "inline-flex";
    qrcodeContainer.style.justifyContent = "center";
    qrcodeContainer.style.alignItems = "center";
    qrcodeContainer.style.minWidth = "272px";
    qrcodeContainer.style.minHeight = "272px";
    qrcodeContainer.innerHTML = "";

    if (typeof window.QRCode === "function") {
        new window.QRCode(qrcodeContainer, {
            text: linkCompleto,
            width: 240,
            height: 240,
            colorDark: "#080d18",
            colorLight: "#ffffff",
            correctLevel: window.QRCode.CorrectLevel.H
        });
    } else {
        const imgQr = document.createElement("img");
        imgQr.alt = "QR Code Oficial SchoolControl";
        imgQr.width = 240;
        imgQr.height = 240;
        imgQr.style.display = "block";
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(linkCompleto)}`;
        qrcodeContainer.appendChild(imgQr);
    }

    if (badgeStatus) badgeStatus.textContent = "QR Code ativo";
    if (statusLeitor) statusLeitor.textContent = "QR Code oficial pronto para leitura pelos alunos.";
}

async function renderizarQrCodeOficial() {
    const urlBase = window.location.origin + window.location.pathname;

    const chaveLocal = extrairChave(localStorage.getItem("schoolcontrol_qr_oficial")) || CHAVE_PADRAO_ESCOLA;
    desenharCanvasOuImagemQR(`${urlBase}?chave=${encodeURIComponent(chaveLocal)}`);

    const chaveNuvem = await obterChaveOficialAtiva();
    if (chaveNuvem && chaveNuvem !== chaveLocal) {
        desenharCanvasOuImagemQR(`${urlBase}?chave=${encodeURIComponent(chaveNuvem)}`);
    }
}

// ==========================================
// 3. CADASTRO ÚNICO NO CELULAR (1ª VEZ)
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
                Preencha uma única vez com seu CPF válido. A partir de amanhã, basta apontar a câmera para liberar em <strong>1 segundo</strong> sem digitar nada.
            </p>
        </div>

        <div id="erroCpfCelular" style="display: none; color: #fca5a5; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; text-align: left;"></div>

        <form id="formIdentificacaoRapida" style="text-align: left;">
            <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 5px; font-weight: 600;">
                CPF do Aluno (obrigatório e válido)
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

            <button type="submit" id="btnSalvarIdentificacao" class="botao-iniciar" style="width: 100%;">
                Salvar no Celular e Liberar
            </button>
        </form>
    `;

    if (badgeStatus) badgeStatus.textContent = "1º Acesso";
    if (statusLeitor) statusLeitor.textContent = "Aguardando vinculação única do aluno.";

    const inputCpf = document.getElementById("alunoCpfCelular");
    const erroBox = document.getElementById("erroCpfCelular");

    inputCpf.addEventListener("input", async function () {
        inputCpf.value = formatarCPF(inputCpf.value);
        erroBox.style.display = "none";

        const cpfLimpo = limparCPF(inputCpf.value);
        if (cpfLimpo.length === 11 && validarCPF(cpfLimpo)) {
            if (window.supabaseAtivo && window.supabaseClient) {
                try {
                    const { data: alunoNuvem } = await window.supabaseClient
                        .from("sc_alunos")
                        .select("*")
                        .eq("cpf_limpo", cpfLimpo)
                        .maybeSingle();

                    if (alunoNuvem) {
                        document.getElementById("alunoNomeCelular").value = alunoNuvem.nome || "";
                        document.getElementById("alunoTurmaCelular").value = alunoNuvem.turma || "";
                        return;
                    }
                } catch {
                    // Continua para verificação local
                }
            }

            const alunosLocais = JSON.parse(localStorage.getItem("schoolcontrol_alunos") || "[]");
            const encontrado = alunosLocais.find(a => limparCPF(a.cpf || a.cpf_limpo || a.matricula) === cpfLimpo);
            if (encontrado) {
                document.getElementById("alunoNomeCelular").value = encontrado.nome;
                document.getElementById("alunoTurmaCelular").value = encontrado.turma;
            }
        }
    });

    document.getElementById("formIdentificacaoRapida").addEventListener("submit", async function (event) {
        event.preventDefault();

        const cpfLimpo = limparCPF(inputCpf.value);
        const cpfFormatado = formatarCPF(cpfLimpo);
        const nome = document.getElementById("alunoNomeCelular").value.trim();
        const turma = document.getElementById("alunoTurmaCelular").value.trim();
        const btnSalvar = document.getElementById("btnSalvarIdentificacao");

        if (!validarCPF(cpfLimpo)) {
            erroBox.textContent = "CPF inválido. Digite um CPF válido com 11 números.";
            erroBox.style.display = "block";
            inputCpf.focus();
            return;
        }

        if (!nome || !turma) return;

        btnSalvar.disabled = true;
        btnSalvar.textContent = "Sincronizando...";

        let alunoFinal = {
            id: crypto.randomUUID(),
            nome,
            turma,
            cpf: cpfFormatado,
            cpfLimpo
        };

        if (window.supabaseAtivo && window.supabaseClient) {
            try {
                const { data: existente } = await window.supabaseClient
                    .from("sc_alunos")
                    .select("*")
                    .eq("cpf_limpo", cpfLimpo)
                    .maybeSingle();

                if (existente) {
                    alunoFinal = {
                        id: existente.id,
                        nome: existente.nome,
                        turma: existente.turma,
                        cpf: existente.cpf,
                        cpfLimpo: existente.cpf_limpo
                    };
                } else {
                    await window.supabaseClient.from("sc_alunos").insert({
                        cpf_limpo: cpfLimpo,
                        id: alunoFinal.id,
                        nome: alunoFinal.nome,
                        turma: alunoFinal.turma,
                        cpf: alunoFinal.cpf
                    });
                }
            } catch (erro) {
                console.error("Erro ao salvar aluno no Supabase:", erro);
            }
        }

        const alunosLocais = JSON.parse(localStorage.getItem("schoolcontrol_alunos") || "[]");
        if (!alunosLocais.some(a => limparCPF(a.cpf || a.cpf_limpo || a.matricula) === cpfLimpo)) {
            alunosLocais.push(alunoFinal);
            localStorage.setItem("schoolcontrol_alunos", JSON.stringify(alunosLocais));
        }

        const perfilDispositivo = {
            id: alunoFinal.id,
            nome: alunoFinal.nome,
            turma: alunoFinal.turma,
            cpf: formatarCPF(alunoFinal.cpf || cpfLimpo),
            cpfLimpo
        };

        localStorage.setItem("schoolcontrol_aluno_dispositivo", JSON.stringify(perfilDispositivo));
        await liberarAcessoEmUmSegundo(perfilDispositivo);
    });
}

// ==========================================
// 4. REGRA: MÁXIMO 1 ENTRADA E 1 SAÍDA POR DIA
// ==========================================

async function buscarRegistrosHojeAluno(cpfLimpo, hoje) {
    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient
                .from("sc_movimentacoes")
                .select("*")
                .eq("dia", hoje)
                .eq("cpf_limpo", cpfLimpo);

            if (Array.isArray(data)) {
                return data.map(item => ({
                    ...item,
                    alunoId: item.aluno_id || item.alunoId,
                    cpfLimpo: item.cpf_limpo || item.cpfLimpo,
                    dataHora: item.data_hora || item.dataHora
                }));
            }
        } catch (erro) {
            console.warn("Falha ao consultar movimentações no Supabase, usando local:", erro);
        }
    }

    const locais = JSON.parse(localStorage.getItem("schoolcontrol_movimentacoes") || "[]");
    return locais.filter(
        m => limparCPF(m.cpfLimpo || m.cpf_limpo || m.cpf || m.matricula) === cpfLimpo && m.dia === hoje
    );
}

async function gravarMovimentacaoNuvemELocal(registro) {
    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            await window.supabaseClient.from("sc_movimentacoes").upsert({
                id: registro.id,
                aluno_id: registro.alunoId,
                cpf: registro.cpf,
                cpf_limpo: registro.cpfLimpo,
                nome: registro.nome,
                turma: registro.turma,
                tipo: registro.tipo,
                data_hora: registro.dataHora,
                dia: registro.dia
            });
        } catch (erro) {
            console.error("Erro ao gravar movimentação no Supabase:", erro);
        }
    }

    const locais = JSON.parse(localStorage.getItem("schoolcontrol_movimentacoes") || "[]");
    locais.unshift(registro);
    localStorage.setItem("schoolcontrol_movimentacoes", JSON.stringify(locais));
}

async function liberarAcessoEmUmSegundo(perfilAluno) {
    painelQrEscola.style.display = "none";
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = "#3b82f6";
    mensagemResultado.innerHTML = `<p style="color: #93c5fd; font-weight: bold;">⚡ Validando acesso...</p>`;

    const agora = new Date();
    const hoje = dataDeHojeLocal();
    const horario = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    const cpfLimpoAtual = limparCPF(perfilAluno.cpfLimpo || perfilAluno.cpf);
    const cpfFormatadoAtual = formatarCPF(cpfLimpoAtual);
    const alunoFormatado = { ...perfilAluno, cpf: cpfFormatadoAtual };

    const registrosHojeAluno = await buscarRegistrosHojeAluno(cpfLimpoAtual, hoje);

    const entradaHoje = registrosHojeAluno.find(m => m.tipo === "Entrada");
    const saidaHoje = registrosHojeAluno.find(m => m.tipo === "Saída");

    if (entradaHoje && saidaHoje) {
        renderizarCartaoLiberado({
            perfilAluno: alunoFormatado,
            estado: "dia_concluido",
            subtexto: `Limite diário atingido: Entrada às ${formatarHoraCurta(entradaHoje.dataHora)} e Saída às ${formatarHoraCurta(saidaHoje.dataHora)}.`
        });
        return;
    }

    if (entradaHoje && !saidaHoje) {
        const diferencaMs = agora.getTime() - new Date(entradaHoje.dataHora).getTime();

        if (diferencaMs >= 0 && diferencaMs < TEMPO_MINIMO_ENTRE_REGISTROS_MS) {
            renderizarCartaoLiberado({
                perfilAluno: alunoFormatado,
                estado: "entrada_recente",
                subtexto: `Entrada já registrada hoje às ${formatarHoraCurta(entradaHoje.dataHora)}. Aguarde o horário de saída.`
            });
            return;
        }

        const registroSaida = {
            id: `${hoje}_${cpfLimpoAtual}_Saída`,
            alunoId: perfilAluno.id,
            cpf: cpfFormatadoAtual,
            cpfLimpo: cpfLimpoAtual,
            nome: perfilAluno.nome,
            turma: perfilAluno.turma,
            tipo: "Saída",
            dataHora: agora.toISOString(),
            dia: hoje
        };

        await gravarMovimentacaoNuvemELocal(registroSaida);
        emitirFeedbackSensorial();

        renderizarCartaoLiberado({
            perfilAluno: alunoFormatado,
            estado: "saida_liberada",
            subtexto: `Saída única do dia registrada às ${horario} (Entrada foi às ${formatarHoraCurta(entradaHoje.dataHora)}).`
        });
        return;
    }

    const registroEntrada = {
        id: `${hoje}_${cpfLimpoAtual}_Entrada`,
        alunoId: perfilAluno.id,
        cpf: cpfFormatadoAtual,
        cpfLimpo: cpfLimpoAtual,
        nome: perfilAluno.nome,
        turma: perfilAluno.turma,
        tipo: "Entrada",
        dataHora: agora.toISOString(),
        dia: hoje
    };

    await gravarMovimentacaoNuvemELocal(registroEntrada);
    emitirFeedbackSensorial();

    renderizarCartaoLiberado({
        perfilAluno: alunoFormatado,
        estado: "entrada_liberada",
        subtexto: `Entrada única do dia liberada às ${horario}`
    });
}

function renderizarCartaoLiberado({ perfilAluno, estado, subtexto }) {
    const estilos = {
        entrada_liberada: {
            borda: "#22c55e",
            corTitulo: "#86efac",
            titulo: "✓ Entrada liberada",
            badge: "Entrada liberada"
        },
        saida_liberada: {
            borda: "#3b82f6",
            corTitulo: "#93c5fd",
            titulo: "✓ Saída liberada",
            badge: "Saída liberada"
        },
        entrada_recente: {
            borda: "#f59e0b",
            corTitulo: "#fcd34d",
            titulo: "✓ Entrada já registrada",
            badge: "Já registrado"
        },
        dia_concluido: {
            borda: "#8b5cf6",
            corTitulo: "#c4b5fd",
            titulo: "✓ Frequência do dia concluída",
            badge: "Dia concluído"
        }
    };

    const visual = estilos[estado] || estilos.entrada_liberada;

    painelQrEscola.style.display = "none";
    resultadoLeitura.style.display = "block";
    resultadoLeitura.style.borderColor = visual.borda;

    mensagemResultado.innerHTML = `
        <div style="margin-bottom: 10px;">
            <span style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid #10b981; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.4px;">
                ⚡ IDENTIFICAÇÃO EM 1 SEGUNDO ATIVA
            </span>
        </div>

        <p style="color: ${visual.corTitulo}; font-weight: bold; font-size: 25px; margin-bottom: 12px;">
            ${visual.titulo}
        </p>

        <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 14px;">
            <p style="font-size: 19px; font-weight: bold; color: #f8fafc; margin-bottom: 4px;">
                ${escaparHTML(perfilAluno.nome)}
            </p>
            <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 4px;">
                Turma: <strong>${escaparHTML(perfilAluno.turma)}</strong> • CPF: <strong>${escaparHTML(perfilAluno.cpf)}</strong>
            </p>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 6px;">
                ${escaparHTML(subtexto)}
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

    if (badgeStatus) badgeStatus.textContent = visual.badge;
    if (statusLeitor) statusLeitor.textContent = "Limite diário: 1 entrada e 1 saída por dia.";
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

async function iniciarPaginaQr() {
    const params = new URLSearchParams(window.location.search);
    const chaveNaUrl = params.get("chave");

    if (chaveNaUrl !== null) {
        const chaveLimpa = chaveNaUrl.trim();
        const chaveOficial = await obterChaveOficialAtiva();

        if (chaveLimpa !== chaveOficial) {
            exibirQrInvalido("Este QR Code não é válido ou foi substituído.");
            return;
        }

        const alunoSalvo = JSON.parse(
            localStorage.getItem("schoolcontrol_aluno_dispositivo") || "null"
        );

        if (alunoSalvo && alunoSalvo.nome && validarCPF(alunoSalvo.cpfLimpo || alunoSalvo.cpf)) {
            await liberarAcessoEmUmSegundo(alunoSalvo);
        } else {
            localStorage.removeItem("schoolcontrol_aluno_dispositivo");
            solicitarIdentificacaoUnica();
        }
        return;
    }

    await renderizarQrCodeOficial();
}

iniciarPaginaQr();