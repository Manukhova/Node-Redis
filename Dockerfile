FROM node:carbon

WORKDIR usr/src/ajson-forms-app

RUN mkdir ./.logs

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 8080

CMD ["npm","start"]
