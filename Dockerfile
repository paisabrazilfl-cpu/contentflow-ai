# Minimal runtime: dist/ is pre-committed and fully self-contained (no node_modules needed)
FROM node:20-alpine
WORKDIR /app
COPY dist/ ./dist/
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "dist/index.mjs"]
