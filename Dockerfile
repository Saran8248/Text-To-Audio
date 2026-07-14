FROM node:20-bullseye-slim

# Install Python 3, pip, and venv
RUN apt-get update \
  && apt-get install -y python3 python3-pip python3-venv ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package configurations and install node modules
COPY Backend/package.json Backend/package-lock.json ./Backend/
RUN cd Backend && npm ci --omit=dev

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

# Copy sources
COPY Backend ./Backend
COPY frontend ./frontend

# Build frontend production assets
RUN cd frontend && npm run build

# Configure Python virtual environment and paths
RUN python3 -m venv /usr/src/app/venv
ENV PATH="/usr/src/app/venv/bin:$PATH"

# Install python dependencies in the virtual environment
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r Backend/requirements.txt

ENV PORT=5000
ENV NODE_ENV=production
ENV PYTHON_EXECUTABLE=/usr/src/app/venv/bin/python

WORKDIR /usr/src/app/Backend

EXPOSE 5000

CMD ["npm", "start"]
