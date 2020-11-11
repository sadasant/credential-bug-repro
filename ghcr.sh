# docker login ghcr.io
docker build --no-cache -t ghcr.io/sadasant/credential-bug-repro .
docker push ghcr.io/sadasant/credential-bug-repro:latest