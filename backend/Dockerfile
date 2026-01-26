# --- Этап 1: Сборка (Builder) ---
# Этот этап отвечает за компиляцию TypeScript в JavaScript.
# Используем образ 'slim' на основе Debian — это более совместимая среда
# для сборки с нативными зависимостями (например, bcrypt или pg).
FROM node:24-slim AS builder

# Устанавливаем рабочую директорию внутри контейнера для всех последующих команд.
WORKDIR /app

# Копируем файлы package.json и package-lock.json.
# Этот шаг вынесен наверх для использования кэширования слоев Docker.
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая devDependencies),
# так как они необходимы для процесса сборки (`nest build`, TypeScript, ESLint, Jest и т.д.).
RUN npm ci

# Копируем все остальные файлы исходного кода в рабочую директорию.
COPY . .

# Компилируем TypeScript-код в JavaScript.
# Результат будет помещён в директорию /app/dist.
RUN npm run build


# --- Этап 2: Установка Production-зависимостей ---
# Этот промежуточный этап создает "чистую" папку node_modules,
# содержащую только production-зависимости.
FROM node:24-slim AS prod-deps

WORKDIR /app

COPY package*.json ./

# Устанавливаем только production-зависимости.
RUN npm ci --omit=dev


# --- Этап 3: Финальный Production-образ ---
# Финальный образ для запуска приложения содержит только необходимые артефакты:
# - dist/ (скомпилированный JS)
# - node_modules (prod deps)
# - package.json (для информации)
FROM node:24-slim AS runner

WORKDIR /app

# Указываем окружение production (улучшает поведение некоторых библиотек).
ENV NODE_ENV=production

# Копируем production-зависимости из prod-deps.
COPY --from=prod-deps /app/node_modules ./node_modules

# Копируем собранные JS-артефакты из builder.
COPY --from=builder /app/dist ./dist

# Копируем package.json (важно: без devDependencies).
COPY package.json ./package.json

# Запускаем контейнер от непривилегированного пользователя.
# Это повышает безопасность в production.
USER node

# Приложение Nest по умолчанию слушает порт 3000.
EXPOSE 3000

# Стартуем приложение напрямую через `node`,
# минуя npm — так быстрее и предсказуемее.
CMD ["node", "dist/main"]
