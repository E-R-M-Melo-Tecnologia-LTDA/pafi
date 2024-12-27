const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: '/chat/socket.io/', // Define o caminho correto
});

// Armazena a senha das salas dinamicamente em memória
// Ex.: { nomeDaSala: "senhaDaSala" }
const salasSenhas = {};

// Armazena as mensagens por sala (texto ou áudio) em memória
// Ex.: {
//   nomeDaSala: [
//     { tipo: 'texto', remetente: 'Fulano', conteudo: 'Olá!' },
//     { tipo: 'audio', remetente: 'Beltrano', conteudo: <ArrayBuffer> }
//   ]
// }
const mensagensPorSala = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('Novo usuário conectado:', socket.id);

  // Usuário tenta entrar em uma sala (ou criar, se não existir)
  socket.on('entrarNaSala', ({ sala, senha }) => {
    // Se a sala não existir, cria agora
    if (!salasSenhas[sala]) {
      salasSenhas[sala] = senha;
      mensagensPorSala[sala] = [];
      console.log(`Sala "${sala}" criada com senha "${senha}".`);
    }

    // Verifica a senha
    if (salasSenhas[sala] === senha) {
      // Sala correta, usuário pode entrar
      socket.join(sala);
      console.log(`${socket.id} entrou na sala ${sala}`);

      // Envia todas as mensagens antigas para quem acabou de entrar
      socket.emit('mensagensAntigas', mensagensPorSala[sala]);

      // Envia uma mensagem de "sistema" para todo mundo na sala
      const msgSistema = {
        tipo: 'texto',
        remetente: 'Sistema',
        conteudo: `Usuário ${socket.id} entrou na sala.`
      };
      mensagensPorSala[sala].push(msgSistema);
      io.to(sala).emit('novaMensagem', msgSistema);

    } else {
      // Senha incorreta, retorna erro
      socket.emit('erroSala', 'Senha incorreta!');
    }
  });

  // Mensagem de texto
  socket.on('enviarMensagemTexto', ({ sala, nome, mensagem }) => {
    if (!mensagensPorSala[sala]) return;

    const novaMsg = {
      tipo: 'texto',
      remetente: nome,
      conteudo: mensagem
    };

    mensagensPorSala[sala].push(novaMsg);
    io.to(sala).emit('novaMensagem', novaMsg);
  });

  // Mensagem de áudio
  socket.on('enviarMensagemAudio', ({ sala, nome, blobAudio }) => {
    if (!mensagensPorSala[sala]) return;

    const novaMsg = {
      tipo: 'audio',
      remetente: nome,
      conteudo: blobAudio // ArrayBuffer do áudio
    };

    mensagensPorSala[sala].push(novaMsg);
    io.to(sala).emit('novaMensagem', novaMsg);
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
