FROM mcr.microsoft.com/appsvc/node:12-lts

WORKDIR /app
COPY . .
CMD ["bash", "bash.sh"]
