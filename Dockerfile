# Runtime: dependencies required for external imports (drizzle-orm, express, jose, etc.)
FROM node:20-alpine
WORKDIR /app
# Install pnpm (faster than npm for large workspaces)
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
# pnpm is faster than npm; install production deps only
RUN pnpm install --prod
COPY dist/ ./dist/
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "dist/index.js"]
