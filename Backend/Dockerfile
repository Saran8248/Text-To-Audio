FROM node:20-bullseye-slim

# Install Python 3, pip, and venv
RUN apt-get update \
  && apt-get install -y python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Configure Python virtual environment and paths
RUN python3 -m venv /usr/src/app/venv
ENV PATH="/usr/src/app/venv/bin:$PATH"

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

COPY . ./

EXPOSE 5000
ENV PORT=5000
ENV PYTHON_EXECUTABLE=/usr/src/app/venv/bin/python

CMD ["npm", "start"]
