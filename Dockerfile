# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the Node backend and combine everything
FROM node:20-alpine

# Install Python and ffmpeg (required for edge-tts)
RUN apk add --no-cache python3 py3-pip ffmpeg && \
    python3 -m venv /opt/venv

# Activate virtual environment and install python dependencies
ENV PATH="/opt/venv/bin:$PATH"
RUN pip3 install edge-tts

WORKDIR /app

# Install backend dependencies
COPY Backend/package*.json ./Backend/
RUN cd Backend && npm install --production

# Copy backend source code
COPY Backend/ ./Backend/

# Copy built frontend static files from Stage 1
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Create cache directory
RUN mkdir -p /app/Backend/cache

# Expose backend port
EXPOSE 5000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=5000
ENV PYTHON_EXECUTABLE=/opt/venv/bin/python

# Start the backend server (which will serve both API and frontend UI)
CMD ["node", "Backend/server.js"]
