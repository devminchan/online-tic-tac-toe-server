# Install Node.js
sudo apt-get update 
sudo apt-get install build-essential libssl-dev

curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh -o install_nvm.sh 
bash install_nvm.sh 
source ~/.profile

nvm install 12.0.0
nvm use 12.0.0

# Pull code
git pull https://github.com/devminchan/online-tic-tac-toe-server.git
cd online-tic-tac-toe-server

# Build and Run
npm install
npm run Build
npm run start:prod
