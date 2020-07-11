FROM node:12

RUN mkdir -p /home/app
WORKDIR /home/app

RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem

RUN ls

COPY package.json /home/app
COPY package-lock.json /home/app

RUN npm install
COPY . /home/app

RUN npm run-script build

CMD npm run-script start:prod