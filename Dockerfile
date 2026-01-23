# Use Motia's base image (has Node + Python ready)
FROM motiadev/motia:latest

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy your app
COPY . .

# Expose the port
EXPOSE 3000

# Start your app
CMD ["npm", "run", "start"]
