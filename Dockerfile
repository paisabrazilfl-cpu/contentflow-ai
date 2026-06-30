# Use Debian-based node image for better npm package compatibility
FROM node:20
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY dist/ ./dist/
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "dist/index.js"]
