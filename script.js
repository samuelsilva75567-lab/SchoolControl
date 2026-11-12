
function abrirTela(tela) {
    const area = document.getElementById("areaConteudo");

    if (tela === "inicio") {
        area.innerHTML = `
            <h2>Bem-vindo ao SchoolControl!</h2>
            <p>Este é o painel principal do sistema escolar.</p>
        `;
    }

    else if (tela === "alunos") {
        area.innerHTML = `
            <h2>Gestão de Alunos</h2>
            <p>Aqui ficará o cadastro e a consulta dos alunos.</p>
        `;
    }

    else if (tela === "entrada") {
        area.innerHTML = `
            <h2>Controle de Entrada e Saída</h2>
            <p>Aqui ficará o controle de movimentação dos alunos.</p>
        `;
    }

    else if (tela === "historico") {
        area.innerHTML = `
            <h2>Histórico de Movimentações</h2>
            <p>Aqui serão exibidos os registros de entrada e saída.</p>
        `;
    }

    else if (tela === "relatorios") {
        area.innerHTML = `
            <h2>Relatórios</h2>
            <p>Aqui ficarão os relatórios do sistema escolar.</p>
        `;
    }
}

