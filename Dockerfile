FROM node:12

WORKDIR /home/app

COPY . .

RUN npm install
RUN npm run-script build

CMD npm run-script start:prod