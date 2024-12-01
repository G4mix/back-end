FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

FROM node:20-alpine

RUN apk update && apk add bash dos2unix

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
COPY --from=builder /app/prisma ./prisma

RUN dos2unix entrypoint.sh

RUN chmod +x entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["bash", "entrypoint.sh"]