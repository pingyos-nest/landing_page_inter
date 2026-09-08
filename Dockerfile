FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source code and assets
COPY server.js ./
COPY index.html ./
COPY logo.png ./

# Create data directory for volume mounting
RUN mkdir -p /app/data/uploads

# Set environment defaults
ENV PORT=80
ENV ADMIN_PASSWORD=admin1234
ENV NODE_ENV=production

EXPOSE 80

CMD ["node", "server.js"]
