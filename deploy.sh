#!/bin/bash

# Nome/Tag da imagem que vamos criar
IMAGE_NAME="pafi"

# Container name (pode alterar se quiser)
CONTAINER_NAME="pafi-container"

# 1. Faz build da imagem
echo "==== Building Docker Image ===="
docker build -t $IMAGE_NAME .

# 2. Para e remove contêiner existente (se estiver rodando)
echo "==== Stopping old container (if any) ===="
docker stop $CONTAINER_NAME 2>/dev/null || true
echo "==== Removing old container (if any) ===="
docker rm $CONTAINER_NAME 2>/dev/null || true

# 3. Sobe um novo contêiner em background na porta 3000
echo "==== Running new container ===="
docker run -d \
  --name $CONTAINER_NAME \
  -p 3000:3000 \
  $IMAGE_NAME

echo "==== Deployment complete! ===="
docker ps | grep $CONTAINER_NAME
