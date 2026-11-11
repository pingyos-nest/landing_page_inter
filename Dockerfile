FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source code and assets
COPY server.js ./
COPY index.html ./
COPY admin.html ./
COPY logo.png favicon.png apple-touch-icon.png ./
COPY calendar-data.js ./

# Create data directory for volume mounting
RUN mkdir -p /app/data/uploads

# Set environment defaults
ENV PORT=4401
# Admin credentials are provided at runtime via env_file (.env), never baked into the image
ENV NODE_ENV=production

EXPOSE 4401

CMD ["node", "server.js"]
