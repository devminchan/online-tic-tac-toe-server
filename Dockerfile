FROM node:12

RUN mkdir -p /home/app
WORKDIR /home/app

COPY package.json /home/app
COPY package-lock.json /home/app

RUN npm install
COPY . /home/app

RUN npm run-script build

CMD npm run-script start:prod