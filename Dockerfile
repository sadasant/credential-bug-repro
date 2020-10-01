FROM mcr.microsoft.com/appsvc/node:12-lts

WORKDIR /app
COPY . .
CMD ["node", "/app/server.js"]
