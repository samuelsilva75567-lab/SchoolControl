// ==========================================
// SCHOOLCONTROL - PAINEL ADMINISTRATIVO EM TEMPO REAL
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

// ==========================================
// COMPONENTES VISUAIS PERSONALIZADOS (MEIO DA TELA)
// ==========================================

function confirmarAcaoSchoolControl({
    titulo = "Confirmar exclusão",
    mensagem = "Tem certeza que deseja continuar?",
    textoConfirmar = "Excluir",
    textoCancelar = "Cancelar"
}) {
    return new Promise(resolve => {
        const anterior = document.getElementById("scModalConfirmacao");
        if (anterior) anterior.remove();

        const overlay = document.createElement("div");
        overlay.id = "scModalConfirmacao";
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.72);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        const caixa = document.createElement("div");
        caixa.style.cssText = `
            width: 440px;
            max-width: 100%;
            background: linear-gradient(145deg, #0b1324, #080d18);
            border: 1px solid #1e3a5f;
            border-top: 4px solid #ef4444;
            border-radius: 16px;
            padding: 24px 26px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75);
            color: #f8fafc;
            font-family: inherit;
            transform: scale(0.95);
            transition: transform 0.2s ease;
        `;

        caixa.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px;">
                <div style="
                    width: 40px;
                    height: 40px;
                    min-width: 40px;
                    border-radius: 12px;
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.45);
                    color: #fca5a5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: bold;
                ">!</div>
                <div style="flex: 1;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.7px; color: #60a5fa; font-weight: 700; margin-bottom: 4px;">
                        Confirmação
                    </div>
                    <h4 style="margin: 0 0 8px 0; font-size: 18px; color: #f8fafc; font-weight: 700;">
                        ${escaparHTML(titulo)}
                    </h4>
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #cbd5e1;">
                        ${escaparHTML(mensagem)}
                    </p>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button
                    type="button"
                    id="scBtnCancelarConfirmacao"
                    style="
                        background: #0f172a;
                        border: 1px solid #334155;
                        color: #cbd5e1;
                        padding: 10px 18px;
                        border-radius: 8px;
                        font-size: 13.5px;
                        font-weight: 600;
                        cursor: pointer;
                    "
                >
                    ${escaparHTML(textoCancelar)}
                </button>
                <button
                    type="button"
                    id="scBtnAceitarConfirmacao"
                    style="
                        background: #dc2626;
                        border: 1px solid #ef4444;
                        color: #ffffff;
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-size: 13.5px;
                        font-weight: 700;
                        cursor: pointer;
                        box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
                    "
                >
                    ${escaparHTML(textoConfirmar)}
                </button>
            </div>
        `;

        overlay.appendChild(caixa);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = "1";
            caixa.style.transform = "scale(1)";
        });

        const fechar = resposta => {
            overlay.style.opacity = "0";
            caixa.style.transform = "scale(0.95)";
            setTimeout(() => overlay.remove(), 180);
            resolve(resposta);
        };

        overlay.addEventListener("click", event => {
            if (event.target === overlay) fechar(false);
        });

        document.getElementById("scBtnCancelarConfirmacao").onclick = () => fechar(false);
        document.getElementById("scBtnAceitarConfirmacao").onclick = () => fechar(true);
    });
}

function notificarSchoolControl(mensagem, tipo = "sucesso") {
    const anterior = document.getElementById("scToastAviso");
    if (anterior) anterior.remove();

    const corBorda = tipo === "erro" ? "#ef4444" : "#10b981";
    const corIcone = tipo === "erro" ? "#fca5a5" : "#6ee7b7";
    const simbolo = tipo === "erro" ? "✕" : "✓";

    const toast = document.createElement("div");
    toast.id = "scToastAviso";
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 360px;
        max-width: calc(100vw - 32px);
        background: linear-gradient(145deg, #0b1324, #080d18);
        border: 1px solid #1e3a5f;
        border-left: 4px solid ${corBorda};
        border-radius: 12px;
        padding: 15px 18px;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.6);
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 99998;
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 0.22s ease, transform 0.22s ease;
    `;

    toast.innerHTML = `
        <span style="color: ${corIcone}; font-weight: bold; font-size: 16px;">${simbolo}</span>
        <span style="font-size: 13.5px; color: #e2e8f0; line-height: 1.4;">${escaparHTML(mensagem)}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(12px)";
        setTimeout(() => toast.remove(), 220);
    }, 3400);
}

// ==========================================
// BOTÃO DISCRETO E MODAL: CONFIGURAR QR CODE
// ==========================================

function inserirBotaoConfigurarQrCode() {
    if (document.getElementById("btnAbrirConfigQr")) return;

    const btnMudarSenha = Array.from(document.querySelectorAll("button")).find(
        b => b.textContent && b.textContent.trim().toLowerCase().includes("mudar senha de admin")
    );

    const btnQr = document.createElement("button");
    btnQr.id = "btnAbrirConfigQr";
    btnQr.type = "button";
    btnQr.textContent = "Configurar QR Code";
    btnQr.onclick = abrirModalConfigurarQrCode;

    if (btnMudarSenha) {
        btnQr.className = btnMudarSenha.className;
        const estiloOriginal = window.getComputedStyle(btnMudarSenha);
        if (estiloOriginal.position === "fixed") {
            const rect = btnMudarSenha.getBoundingClientRect();
            btnQr.style.position = "fixed";
            btnQr.style.bottom = estiloOriginal.bottom;
            btnQr.style.left = `${rect.right + 12}px`;
            btnQr.style.zIndex = estiloOriginal.zIndex || "1000";
            document.body.appendChild(btnQr);
        } else {
            btnQr.style.marginLeft = "10px";
            btnMudarSenha.insertAdjacentElement("afterend", btnQr);
        }
    } else {
        btnQr.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 205px;
            background: #0f172a;
            border: 1px solid #1e293b;
            color: #e2e8f0;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            z-index: 1000;
        `;
        document.body.appendChild(btnQr);
    }
}

function abrirModalConfigurarQrCode() {
    const anterior = document.getElementById("scModalConfigQr");
    if (anterior) anterior.remove();

    const codigoAtual = localStorage.getItem("schoolcontrol_qr_oficial") || "";

    const overlay = document.createElement("div");
    overlay.id = "scModalConfigQr";
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.75);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 99999;
    `;

    overlay.innerHTML = `
        <div style="
            width: 460px;
            max-width: 100%;
            background: linear-gradient(145deg, #0b1324, #080d18);
            border: 1px solid #1e3a5f;
            border-top: 4px solid #3b82f6;
            border-radius: 16px;
            padding: 24px 26px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75);
            color: #f8fafc;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 18px; color: #f8fafc;">Configurar QR Code Oficial</h3>
                <button type="button" id="btnFecharModalQr" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; padding: 0 4px;">×</button>
            </div>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                Gere uma nova chave de acesso para a portaria ou salve o link oficial sincronizado com os celulares.
            </p>

            <form id="formModalQrOficial">
                <label for="inputModalQrOficial" style="display: block; font-size: 12.5px; color: #cbd5e1; margin-bottom: 6px; font-weight: 600;">
                    Link / Conteúdo do QR Code Oficial
                </label>
                <input
                    type="text"
                    id="inputModalQrOficial"
                    value="${escaparHTML(codigoAtual)}"
                    placeholder="Clique em Gerar Novo QR Code"
                    required
                    style="width: 100%; padding: 11px 12px; border-radius: 8px; border: 1px solid #334155; background: #080d18; color: #f8fafc; font-size: 13px; margin-bottom: 14px; box-sizing: border-box;"
                >

                <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end;">
                    <button
                        type="button"
                        id="btnGerarNovoQrModal"
                        style="background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;"
                    >
                        Gerar Novo QR Code
                    </button>
                    <button
                        type="submit"
                        style="background: #2563eb; border: 1px solid #3b82f6; color: #ffffff; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;"
                    >
                        Salvar QR Code Oficial
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    const fecharModal = () => overlay.remove();

    document.getElementById("btnFecharModalQr").onclick = fecharModal;
    overlay.addEventListener("click", event => {
        if (event.target === overlay) fecharModal();
    });

    document.getElementById("btnGerarNovoQrModal").onclick = () => {
        const campo = document.getElementById("inputModalQrOficial");
        const chaveSecreta = "SCHOOLCONTROL-" + crypto.randomUUID().toUpperCase();
        const urlBase = window.location.href.replace(/index\.html.*$/, "").replace(/\/$/, "");
        campo.value = `${urlBase}/qrcode.html?chave=${chaveSecreta}`;
    };

    document.getElementById("formModalQrOficial").addEventListener("submit", async function (event) {
        event.preventDefault();
        const valor = document.getElementById("inputModalQrOficial").value.trim();
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

        fecharModal();
        notificarSchoolControl("QR Code oficial atualizado e sincronizado!");
    });
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
        inserirBotaoConfigurarQrCode();
        iniciarSincronizacaoSupabase();
    } else {
        telaLogin.style.display = "flex";
        painel.style.display = "none";
        document.getElementById("btnAbrirConfigQr")?.remove();
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
    notificarSchoolControl("Senha de administrador alterada com sucesso!");
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
            const inputModalQr = document.getElementById("inputModalQrOficial");
            if (inputModalQr && !inputModalQr.value) inputModalQr.value = resConfig.data.valor;
        }

        atualizarResumo();
        if (telaAtualAdmin === "alunos") mostrarTelaAlunos();
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
// 4. TELA INICIAL LIMPA (SEM LINK EXPOSTO)
// ==========================================

function mostrarTelaInicio() {
    telaAtualAdmin = "inicio";
    const area = document.getElementById("areaConteudo");
    if (!area) return;

    area.innerHTML = `
        <h2>Bem-vindo ao SchoolControl!</h2>
        <p>Gerencie o QR Code da portaria, alunos e registros de acesso em tempo real.</p>
    `;
}


// ==========================================
// 5. TELA DE ALUNOS (CADASTRO E EXCLUSÃO INDIVIDUAL)
// ==========================================

function mostrarTelaAlunos() {
    telaAtualAdmin = "alunos";
    const area = document.getElementById("areaConteudo");

    area.innerHTML = `
        <h2>Gestão de Alunos</h2>
        <p>Cadastre, consulte ou exclua alunos pelo CPF válido.</p>

        <form id="formAluno">
            <label>Nome do aluno</label>
            <input type="text" id="nomeAluno" placeholder="Digite o nome" required>

            <label>Turma</label>
            <input type="text" id="turmaAluno" placeholder="Ex: 8º ano A" required>

            <label>CPF válido</label>
            <input type="text" id="cpfAluno" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" required>

            <button type="submit">Cadastrar aluno</button>
        </form>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; flex-wrap: wrap; gap: 10px;">
            <h3 style="margin: 0;">Alunos cadastrados (${alunos.length})</h3>
            ${alunos.length > 0 ? `<button type="button" onclick="excluirTodosAlunos()" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5;">Excluir todos os alunos</button>` : ""}
        </div>
        <div id="listaAlunos" style="margin-top: 12px;"></div>
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
        notificarSchoolControl("Preencha todos os campos.", "erro");
        return;
    }

    if (!validarCPF(cpfLimpo)) {
        notificarSchoolControl("CPF inválido. Digite um CPF válido com 11 números.", "erro");
        return;
    }

    if (alunos.some(aluno => limparCPF(aluno.cpf || aluno.cpfLimpo || aluno.matricula) === cpfLimpo)) {
        notificarSchoolControl("Esse CPF já está cadastrado.", "erro");
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
    notificarSchoolControl("Aluno cadastrado com sucesso!");
}

async function excluirAlunoCompleto(cpfLimpoOuId) {
    const aluno = alunos.find(
        a => limparCPF(a.cpfLimpo || a.cpf) === cpfLimpoOuId || a.id === cpfLimpoOuId
    );
    if (!aluno) return;

    const aceitou = await confirmarAcaoSchoolControl({
        titulo: "Excluir aluno do sistema?",
        mensagem: `Deseja remover "${aluno.nome}" e apagar todo o histórico de entradas e saídas deste aluno?`,
        textoConfirmar: "Excluir aluno",
        textoCancelar: "Cancelar"
    });

    if (!aceitou) return;

    const cpfAlvo = limparCPF(aluno.cpfLimpo || aluno.cpf);

    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            if (cpfAlvo) {
                await window.supabaseClient.from("sc_movimentacoes").delete().eq("cpf_limpo", cpfAlvo);
                await window.supabaseClient.from("sc_alunos").delete().eq("cpf_limpo", cpfAlvo);
            } else {
                await window.supabaseClient.from("sc_movimentacoes").delete().eq("aluno_id", aluno.id);
                await window.supabaseClient.from("sc_alunos").delete().eq("id", aluno.id);
            }
        } catch (erro) {
            console.error("Erro ao excluir aluno no Supabase:", erro);
        }
    }

    alunos = alunos.filter(
        a => !(cpfAlvo ? limparCPF(a.cpfLimpo || a.cpf) === cpfAlvo : a.id === aluno.id)
    );
    movimentacoes = movimentacoes.filter(
        m => !(cpfAlvo ? limparCPF(m.cpfLimpo || m.cpf) === cpfAlvo : m.alunoId === aluno.id)
    );

    salvarAlunosLocal();
    salvarMovimentacoesLocal();
    atualizarResumo();

    if (telaAtualAdmin === "alunos") mostrarTelaAlunos();
    if (telaAtualAdmin === "historico") filtrarHistorico();
    if (telaAtualAdmin === "entrada") mostrarTelaMovimentacao();
    if (telaAtualAdmin === "relatorios") mostrarRelatorios();

    notificarSchoolControl(`"${aluno.nome}" foi removido de todo o sistema.`);
}

async function excluirTodosAlunos() {
    if (alunos.length === 0) return;

    const aceitou = await confirmarAcaoSchoolControl({
        titulo: "Excluir todos os alunos?",
        mensagem: "Essa ação removerá todos os alunos cadastrados e apagará todo o histórico da nuvem e do painel.",
        textoConfirmar: "Excluir tudo",
        textoCancelar: "Cancelar"
    });

    if (!aceitou) return;

    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            await window.supabaseClient.from("sc_movimentacoes").delete().neq("id", "");
            await window.supabaseClient.from("sc_alunos").delete().neq("cpf_limpo", "");
        } catch (erro) {
            console.error("Erro ao excluir todos os dados no Supabase:", erro);
        }
    }

    alunos = [];
    movimentacoes = [];
    salvarAlunosLocal();
    salvarMovimentacoesLocal();
    atualizarResumo();
    mostrarTelaAlunos();
    notificarSchoolControl("Todos os alunos e registros foram excluídos!");
}

function atualizarListaAlunos() {
    const lista = document.getElementById("listaAlunos");
    if (!lista) return;

    if (alunos.length === 0) {
        lista.innerHTML = "<p>Nenhum aluno cadastrado ainda.</p>";
        return;
    }

    lista.innerHTML = alunos.map(aluno => {
        const identificador = limparCPF(aluno.cpfLimpo || aluno.cpf) || aluno.id;
        return `
            <div class="aluno-item" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
                <div>
                    <strong>${escaparHTML(aluno.nome)}</strong>
                    <p>Turma: ${escaparHTML(aluno.turma)}</p>
                    <p>CPF: ${escaparHTML(aluno.cpf || aluno.matricula || "Não informado")}</p>
                </div>
                <button
                    type="button"
                    onclick="excluirAlunoCompleto('${escaparHTML(identificador)}')"
                    style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 8px 12px; border-radius: 8px; cursor: pointer;"
                >
                    Excluir aluno
                </button>
            </div>
        `;
    }).join("");
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
        notificarSchoolControl("Selecione um aluno válido.", "erro");
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

    notificarSchoolControl(`${tipo} registrada com sucesso!`);
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
// 7. HISTÓRICO (EXCLUIR 1 OU EXCLUIR TUDO DE TODAS AS ABAS)
// ==========================================

function mostrarHistorico() {
    telaAtualAdmin = "historico";
    const area = document.getElementById("areaConteudo");

    area.innerHTML = `
        <div class="cabecalho-historico">
            <h2>Histórico de Movimentações</h2>
            <p>Consulte e gerencie todas as entradas e saídas dos alunos.</p>
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

            <button type="button" onclick="limparHistorico()" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5;">
                Limpar histórico e alunos
            </button>

            <div class="tabela-responsiva">
                <table class="tabela-historico">
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Turma</th>
                            <th>Movimentação</th>
                            <th>Data e horário</th>
                            <th>Ação</th>
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
        corpo.innerHTML = `<tr><td colspan="5" class="historico-vazio">Nenhuma movimentação encontrada.</td></tr>`;
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
            <td>
                <button
                    type="button"
                    onclick="excluirRegistroUnico('${escaparHTML(item.id)}')"
                    style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor: pointer;"
                >
                    Excluir
                </button>
            </td>
        </tr>
    `).join("");
}

async function excluirRegistroUnico(registroId) {
    const registro = movimentacoes.find(m => m.id === registroId);
    if (!registro) return;

    const aceitou = await confirmarAcaoSchoolControl({
        titulo: `Excluir registro de ${registro.tipo}?`,
        mensagem: `Deseja apagar o registro de ${registro.tipo} de "${registro.nome}"?`,
        textoConfirmar: "Excluir registro",
        textoCancelar: "Cancelar"
    });

    if (!aceitou) return;

    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            await window.supabaseClient.from("sc_movimentacoes").delete().eq("id", registroId);
        } catch (erro) {
            console.error("Erro ao excluir registro no Supabase:", erro);
        }
    }

    movimentacoes = movimentacoes.filter(m => m.id !== registroId);
    salvarMovimentacoesLocal();

    const cpfAlvo = limparCPF(registro.cpfLimpo || registro.cpf);
    const aindaTemRegistros = movimentacoes.some(
        m => (cpfAlvo ? limparCPF(m.cpfLimpo || m.cpf) === cpfAlvo : m.alunoId === registro.alunoId)
    );

    if (!aindaTemRegistros) {
        const removerAluno = await confirmarAcaoSchoolControl({
            titulo: "Remover aluno também?",
            mensagem: `"${registro.nome}" não possui mais movimentações. Deseja removê-lo também da aba Alunos e de todo o sistema?`,
            textoConfirmar: "Remover aluno",
            textoCancelar: "Manter cadastro"
        });

        if (removerAluno) {
            if (window.supabaseAtivo && window.supabaseClient) {
                try {
                    if (cpfAlvo) {
                        await window.supabaseClient.from("sc_alunos").delete().eq("cpf_limpo", cpfAlvo);
                    } else if (registro.alunoId) {
                        await window.supabaseClient.from("sc_alunos").delete().eq("id", registro.alunoId);
                    }
                } catch (erro) {
                    console.error("Erro ao remover aluno no Supabase:", erro);
                }
            }

            alunos = alunos.filter(
                a => !(cpfAlvo ? limparCPF(a.cpfLimpo || a.cpf) === cpfAlvo : a.id === registro.alunoId)
            );
            salvarAlunosLocal();
        }
    }

    filtrarHistorico();
    atualizarResumo();
    notificarSchoolControl("Registro excluído com sucesso!");
}

async function limparHistorico() {
    if (movimentacoes.length === 0 && alunos.length === 0) {
        notificarSchoolControl("O histórico e a lista de alunos já estão vazios.");
        return;
    }

    const aceitou = await confirmarAcaoSchoolControl({
        titulo: "Limpar histórico e alunos?",
        mensagem: "Tem certeza que deseja apagar TODO o histórico e remover TODOS os alunos de todas as abas?",
        textoConfirmar: "Limpar tudo",
        textoCancelar: "Cancelar"
    });

    if (!aceitou) return;

    if (window.supabaseAtivo && window.supabaseClient) {
        try {
            await window.supabaseClient.from("sc_movimentacoes").delete().neq("id", "");
            await window.supabaseClient.from("sc_alunos").delete().neq("cpf_limpo", "");
        } catch (erro) {
            console.error("Erro ao limpar dados no Supabase:", erro);
        }
    }

    movimentacoes = [];
    alunos = [];
    salvarMovimentacoesLocal();
    salvarAlunosLocal();
    filtrarHistorico();
    atualizarResumo();
    notificarSchoolControl("Histórico e alunos apagados de todas as abas!");
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
        notificarSchoolControl("Verifique as datas informadas.", "erro");
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
        notificarSchoolControl("Não existem movimentações para exportar.", "erro");
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
