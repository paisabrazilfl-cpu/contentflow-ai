# Runtime: dependencies required for external imports (drizzle-orm, express, jose, etc.)
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
# --legacy-peer-deps: vite@7 conflicts with @builder.io/vite-plugin-jsx-loc (needs vite@^4||^5)
RUN npm install --legacy-peer-deps --no-cache
# Cache-bust: $(date)
COPY dist/ ./dist/
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "dist/index.js"]
