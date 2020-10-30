FROM mcr.microsoft.com/appsvc/node:12-lts

WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "/app/server.js"]
