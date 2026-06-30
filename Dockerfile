# Runtime: full install (including dev deps) to ensure no missing packages
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY dist/ ./dist/
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "dist/index.js"]
