# Dockerfile
FROM node:16

# create destination directory
WORKDIR /app

# copy the app, note .dockerignore
COPY . /app

RUN npm install
RUN npm run generate

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=4895

EXPOSE 4895

CMD [ "npm", "run", "start" ]
