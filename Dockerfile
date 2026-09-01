FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Variáveis NEXT_PUBLIC_* são incorporadas durante o build do Next.js.
ARG NEXT_PUBLIC_API_URL=http://localhost:7052
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV PORT=7053
ENV HOSTNAME=0.0.0.0

EXPOSE 7053

CMD ["npm", "run", "start"]
