// Faz a conexão com o servidor Socket.IO
const socket = io('/chat');

// Seletores de elementos
const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const mensagensDiv = document.getElementById('mensagens');

const salaInput = document.getElementById('sala');
const senhaInput = document.getElementById('senha');
const nomeUsuarioInput = document.getElementById('nomeUsuario');
const btnEntrar = document.getElementById('btnEntrar');
const erroSala = document.getElementById('erroSala');

const tituloSala = document.getElementById('tituloSala');
const campoMensagem = document.getElementById('campoMensagem');
const btnEnviarTexto = document.getElementById('btnEnviarTexto');

const btnGravarAudio = document.getElementById('btnGravarAudio');
const btnPararGravacao = document.getElementById('btnPararGravacao');
const btnEnviarAudio = document.getElementById('btnEnviarAudio');
const statusGravacao = document.getElementById('statusGravacao');

// Variáveis globais
let salaAtual = '';
let nomeUsuario = '';
let mediaRecorder;
let chunks = [];

// 1. Entrar na sala
btnEntrar.addEventListener('click', () => {
  const sala = salaInput.value.trim();
  const senha = senhaInput.value.trim();
  nomeUsuario = nomeUsuarioInput.value.trim();

  if (!sala || !nomeUsuario) {
    erroSala.textContent = 'Preencha a sala e seu nome!';
    return;
  }

  salaAtual = sala;
  // Emite para o servidor que queremos entrar (ou criar) a sala
  socket.emit('entrarNaSala', { sala, senha });
});

// 2. Receber mensagens antigas (ao entrar na sala)
socket.on('mensagensAntigas', (listaMensagens) => {
  // Esconde login, mostra chat
  loginDiv.style.display = 'none';
  chatDiv.style.display = 'block';
  tituloSala.textContent = `Sala: ${salaAtual}`;

  // Renderizar todas as mensagens anteriores
  listaMensagens.forEach((msg) => {
    renderMensagem(msg);
  });
});

// 3. Se a senha estiver incorreta ou outro erro
socket.on('erroSala', (msg) => {
  erroSala.textContent = msg;
});

// 4. Receber nova mensagem (texto ou áudio)
socket.on('novaMensagem', (msg) => {
  renderMensagem(msg);
});

// 5. Função para exibir mensagem no chat
function renderMensagem(msg) {
  const p = document.createElement('p');

  if (msg.tipo === 'texto') {
    // Mensagem de texto
    p.innerHTML = `<strong>${msg.remetente}:</strong> ${msg.conteudo}`;

  } else if (msg.tipo === 'audio') {
    // Mensagem de áudio
    p.innerHTML = `<strong>${msg.remetente} (áudio):</strong> `;
    const blob = new Blob([msg.conteudo], { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);

    const audioElement = document.createElement('audio');
    audioElement.src = url;
    audioElement.controls = true;
    p.appendChild(audioElement);
  }

  mensagensDiv.appendChild(p);
  mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
}

// -----------------------------------------------------------------
// 6. Envio de texto
// -----------------------------------------------------------------
btnEnviarTexto.addEventListener('click', () => {
  const mensagem = campoMensagem.value.trim();
  if (!mensagem) return;

  socket.emit('enviarMensagemTexto', {
    sala: salaAtual,
    nome: nomeUsuario,
    mensagem
  });

  campoMensagem.value = '';
});

// -----------------------------------------------------------------
// 7. Gravação e envio de áudio (mensagem assíncrona, não é streaming)
// -----------------------------------------------------------------
btnGravarAudio.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.onstart = () => {
      chunks = [];
      statusGravacao.textContent = 'Gravando...';
      btnGravarAudio.disabled = true;
      btnPararGravacao.disabled = false;
      btnEnviarAudio.disabled = true;
    };

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      statusGravacao.textContent = 'Gravação parada. Pronto para enviar.';
      btnGravarAudio.disabled = false;
      btnPararGravacao.disabled = true;
      btnEnviarAudio.disabled = false;
    };

    mediaRecorder.start();
  } catch (error) {
    alert('Não foi possível acessar o microfone.');
    console.error(error);
  }
});

btnPararGravacao.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
});

btnEnviarAudio.addEventListener('click', () => {
  const blob = new Blob(chunks, { type: 'audio/webm' });

  // Precisamos transformar em ArrayBuffer para enviar via Socket.IO
  blob.arrayBuffer().then((arrayBuffer) => {
    socket.emit('enviarMensagemAudio', {
      sala: salaAtual,
      nome: nomeUsuario,
      blobAudio: arrayBuffer
    });
    statusGravacao.textContent = 'Áudio enviado!';
    btnEnviarAudio.disabled = true;
  });
});
