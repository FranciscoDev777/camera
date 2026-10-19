const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const contexto = canvas.getContext("2d");

const campoIdentificacao = document.getElementById("identificacao");
const seletorFiltro = document.getElementById("filtro");

const btnCamera = document.getElementById("btn-camera");
const btnCapturar = document.getElementById("btn-capturar");
const btnDesligar = document.getElementById("btn-desligar");
const btnBaixar = document.getElementById("btn-baixar");

const resultado = document.getElementById("resultado");
const mensagem = document.getElementById("mensagem");

let stream = null;

// Exibe mensagens para o usuário
function mostrarMensagem(texto, tipo = "info") {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

// Atualiza os botões
function atualizarBotoes(cameraLigada) {
  btnCamera.disabled = cameraLigada;
  btnCapturar.disabled = !cameraLigada;
  btnDesligar.disabled = !cameraLigada;
}

// Liga a câmera
async function ligarCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Seu navegador não permite acessar a câmera. Use HTTPS ou localhost.",
      );
    }

    // Encerra uma transmissão anterior, se existir
    desligarCamera(false);

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
      },
      audio: false,
    });

    video.srcObject = stream;
    video.hidden = false;

    await video.play();

    atualizarBotoes(true);

    mostrarMensagem("Câmera ligada! Você já pode tirar sua foto.", "sucesso");
  } catch (erro) {
    console.error("Erro ao acessar a câmera:", erro);

    if (
      erro.name === "NotAllowedError" ||
      erro.name === "PermissionDeniedError"
    ) {
      mostrarMensagem(
        "Acesso à câmera negado. Permita o uso da câmera nas configurações do navegador.",
        "erro",
      );
    } else if (
      erro.name === "NotFoundError" ||
      erro.name === "DevicesNotFoundError"
    ) {
      mostrarMensagem(
        "Nenhuma câmera foi encontrada neste dispositivo.",
        "erro",
      );
    } else if (
      erro.name === "NotReadableError" ||
      erro.name === "TrackStartError"
    ) {
      mostrarMensagem(
        "Não foi possível acessar a câmera. Ela pode estar sendo usada por outro programa.",
        "erro",
      );
    } else {
      mostrarMensagem(
        `Não foi possível ligar a câmera: ${erro.message}`,
        "erro",
      );
    }

    desligarCamera(false);
  }
}

// Desliga a câmera e libera os recursos
function desligarCamera(exibirMensagem = true) {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });

    stream = null;
  }

  video.srcObject = null;
  video.hidden = true;
  video.style.filter = "none";

  atualizarBotoes(false);

  if (exibirMensagem) {
    mostrarMensagem("Câmera desligada.", "info");
  }
}

// Captura a foto, aplica o filtro e escreve os dados
function capturarFoto() {
  if (!stream || !video.videoWidth || !video.videoHeight) {
    mostrarMensagem(
      "Ligue a câmera e espere a imagem aparecer antes de capturar.",
      "erro",
    );
    return;
  }

  const identificacao = campoIdentificacao.value.trim();

  if (!identificacao) {
    mostrarMensagem(
      "Digite seu nome ou identificação antes de tirar a foto.",
      "erro",
    );

    campoIdentificacao.focus();
    return;
  }

  // Define o tamanho do canvas pela resolução da câmera
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Aplica o filtro selecionado e desenha a imagem
  contexto.save();

  contexto.filter = seletorFiltro.value || "none";

  contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

  contexto.restore();

  // Cria uma faixa escura na parte inferior da imagem
  const alturaFaixa = Math.max(70, canvas.height * 0.13);

  const posicaoY = canvas.height - alturaFaixa;

  contexto.fillStyle = "rgba(0, 0, 0, 0.7)";

  contexto.fillRect(0, posicaoY, canvas.width, alturaFaixa);

  // Define o tamanho dos textos
  const tamanhoFonte = Math.max(18, Math.round(canvas.width * 0.035));

  const margem = Math.max(12, Math.round(canvas.width * 0.02));

  // Escreve a identificação na foto
  contexto.fillStyle = "#ffffff";
  contexto.font = `bold ${tamanhoFonte}px Arial`;
  contexto.textBaseline = "top";

  contexto.fillText(
    identificacao,
    margem,
    posicaoY + margem,
    canvas.width - margem * 2,
  );

  // Obtém a data e a hora atuais
  const dataHora = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date());

  // Escreve a data e a hora na foto
  contexto.font = `${Math.max(14, Math.round(tamanhoFonte * 0.65))}px Arial`;

  contexto.fillText(
    dataHora,
    margem,
    posicaoY + margem + tamanhoFonte + 6,
    canvas.width - margem * 2,
  );

  // Mostra a imagem processada
  canvas.hidden = false;
  resultado.hidden = false;
  btnBaixar.disabled = false;

  mostrarMensagem(
    "Foto capturada com sucesso! Você pode baixar a imagem.",
    "sucesso",
  );
}

// Baixa a imagem processada
function baixarFoto() {
  if (canvas.hidden || canvas.width === 0 || canvas.height === 0) {
    mostrarMensagem("Tire uma foto antes de tentar baixá-la.", "erro");
    return;
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      mostrarMensagem("Não foi possível gerar o arquivo da foto.", "erro");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "foto-capturada.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    mostrarMensagem("Download da foto iniciado!", "sucesso");
  }, "image/png");
}

// Atualiza o filtro na prévia da câmera
seletorFiltro.addEventListener("change", () => {
  video.style.filter = seletorFiltro.value || "none";
});

// Configura os botões
btnCamera.addEventListener("click", ligarCamera);

btnCapturar.addEventListener("click", capturarFoto);

btnDesligar.addEventListener("click", () => {
  desligarCamera();
});

btnBaixar.addEventListener("click", baixarFoto);

// Estado inicial
atualizarBotoes(false);
btnBaixar.disabled = true;

// Desliga a câmera ao sair da página
window.addEventListener("pagehide", () => {
  desligarCamera(false);
});
