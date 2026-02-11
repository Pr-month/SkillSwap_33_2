# --- Этап 1: Сборка ---
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# --- Этап 2: Финальный образ ---
FROM node:24-alpine AS runner

# Устанавливаем production-окружение
ENV NODE_ENV=production

WORKDIR /app

# Устанавливаем только serve (лёгкий HTTP-сервер для статики)
RUN npm install -g serve

# Копируем статику
COPY --from=builder /app/dist ./dist

# Создаём non-root пользователя
RUN addgroup -g 1001 -S appgroup && \
  adduser -S appuser -u 1001 -G appgroup

USER appuser

# Порт по умолчанию для serve
EXPOSE 3000

# Запускаем статический сервер
CMD ["serve", "-s", "dist", "-l", "3000"]