FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# The bot uses polling, so no ports need to be exposed
# unless you switch to webhooks.

CMD [ "node", "index.js" ]
