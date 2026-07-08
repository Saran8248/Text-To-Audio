FROM node:20-bullseye-slim

RUN apt-get update \
  && apt-get install -y python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY Backend/package.json Backend/package-lock.json ./Backend/
RUN cd Backend && npm ci --omit=dev

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

COPY Backend ./Backend
COPY frontend ./frontend

RUN cd frontend && npm run build

ENV PORT=5000
ENV NODE_ENV=production
ENV PYTHON_EXECUTABLE=/usr/bin/python3

WORKDIR /usr/src/app/Backend

RUN python3 -m pip install --no-cache-dir --upgrade pip \
  && python3 -m pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["npm", "start"]
