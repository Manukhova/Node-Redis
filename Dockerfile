FROM node:9.11.2-jessie

WORKDIR usr/src/node-redis-app

COPY . .

EXPOSE 8080

CMD ["npm","start"]
