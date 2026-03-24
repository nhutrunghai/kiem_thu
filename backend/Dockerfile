FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/. .
COPY swagger.yaml ./swagger.yaml

EXPOSE 5050

CMD ["npm", "start"]
