# Minimal runtime: dist/ is pre-committed and fully self-contained
# package.json must be in /app/ so Node.js treats .js files as ESM
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY dist/ ./dist/
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
# No HEALTHCHECK — let Render detect the port binding
CMD ["node", "dist/index.js"]
