FROM node:20-bullseye-slim

# Install Python 3 and pip on the server container.
RUN apt-get update \
  && apt-get install -y python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY requirements.txt ./
RUN python3 -m pip install --no-cache-dir --upgrade pip \
  && python3 -m pip install --no-cache-dir -r requirements.txt

COPY . ./

EXPOSE 5000
ENV PORT=5000
ENV PYTHON_EXECUTABLE=/usr/bin/python3

CMD ["npm", "start"]
