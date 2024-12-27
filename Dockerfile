# Escolhe uma imagem base do Node.js (LTS) com Alpine (mais leve)
FROM node:lts-alpine

# Cria e define o diretório de trabalho da aplicação
WORKDIR /app

# Copia os arquivos de dependências (package.json, package-lock.json)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código do projeto para dentro do contêiner
COPY . .

# Informa a porta que o servidor usará
EXPOSE 3001

# Define o comando padrão para iniciar a aplicação
CMD ["npm", "start"]
