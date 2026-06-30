# Minimal runtime: dist/ is pre-committed and fully self-contained (no node_modules needed)
FROM node:20-alpine
WORKDIR /app/dist
COPY dist/ ./
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "require('http').get('http://localhost:10000/', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "index.mjs"]
