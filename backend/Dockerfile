FROM node:26-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:26-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# postinstall chạy prisma generate, tạo lại src/generated cho seed và script nạp dữ liệu
RUN npm ci --omit=dev && chown -R node:node /app
COPY --from=build /app/dist ./dist
COPY scripts ./scripts
COPY prompts ./prompts
COPY src/questions/import-validator.ts ./src/questions/import-validator.ts
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
