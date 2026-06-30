# Dependencies needed at runtime for external imports (drizzle-orm, express, jose, etc.)
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
# Use --legacy-peer-deps to bypass vite@7 vs @builder.io/vite-plugin-jsx-loc peer conflict
RUN npm install --omit=dev --legacy-peer-deps
COPY dist/ ./dist/
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "dist/index.js"]
