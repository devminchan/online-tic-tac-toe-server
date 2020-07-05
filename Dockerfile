FROM node:12

WORKDIR /home/app

COPY . .

RUN npm install
RUN npm run build

CMD npm start:prod