FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
RUN mkdir -p /app/storage/uploads && chown -R node:node /app/storage
EXPOSE 4000
USER node
CMD ["node","src/index.js"]