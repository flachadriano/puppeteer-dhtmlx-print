# Define a imagem base como a versão mais recente do Node.js LTS
FROM node:18.14.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
# Cria um diretório de trabalho para a aplicação
WORKDIR /usr/src/app

# Pupperter dependency
RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Copia o package.json e o package-lock.json (se existir) para o diretório de trabalho
COPY package.json ./
# Instala as dependências da aplicação
RUN npm install -f --production --no-optional

# Copia todo o conteúdo da aplicação para o diretório de trabalho
COPY . .

# Expõe a porta 3000 para acesso externo
EXPOSE 3003

# Inicia a aplicação
CMD [ "npm", "run", "startts" ]
