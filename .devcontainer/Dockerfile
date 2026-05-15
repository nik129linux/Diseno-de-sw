# Imagen oficial de Java 17 sin Node/Yarn preinstalado
FROM mcr.microsoft.com/devcontainers/java:1-17-bullseye

USER root

# 👇 ELIMINAR repos de Node/Yarn que VS Code pueda inyectar (línea crítica)
RUN rm -f /etc/apt/sources.list.d/yarn.list /etc/apt/sources.list.d/nodesource.list 2>/dev/null || true

# Instalar solo lo necesario para Spring Boot
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
        maven \
        curl \
        git \
        ca-certificates \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Volver al usuario vscode (requerido por Dev Containers)
USER vscode

WORKDIR /workspace
EXPOSE 8080
CMD ["sleep", "infinity"]
