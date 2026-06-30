# Minimal runtime: dist/ is pre-committed and fully self-contained
FROM node:20-alpine
WORKDIR /app/dist
COPY dist/ ./
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
# No HEALTHCHECK — container relies on Render's port binding check
CMD ["node", "index.mjs"]
