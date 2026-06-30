# Minimal Docker runtime (not used by current Node.js deployment)
# Kept for reference — NOT used by the active Node.js service
FROM node:20-alpine
WORKDIR /app
COPY dist/ ./dist/
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "dist/index.js"]
