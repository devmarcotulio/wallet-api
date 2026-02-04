# Estágio de Build
# Usamos a 22-alpine que é a versão LTS (Long Term Support) mais estável e segura
FROM node:22-alpine AS builder

# Atualiza os pacotes do Alpine para corrigir vulnerabilidades de segurança do SO
RUN apk update && apk upgrade

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Estágio de Produção
FROM node:22-alpine

# Repetimos o upgrade no estágio final para garantir a segurança da imagem de runtime
RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Usar 'node' diretamente é mais seguro e performático em produção que 'npm run'
CMD ["node", "dist/main.js"]