# Use Motia's base image (has Node + Python ready)
FROM motiadev/motia:latest

# Install Puppeteer system dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy your app
COPY . .

# Expose the port
EXPOSE 3000

# Start your app
CMD ["npm", "start"]
