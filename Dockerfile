FROM node:18-slim

# Based on https://github.com/beemi/puppeteer-headful

RUN mkdir -p /app/
WORKDIR /app/
ADD .env /app
ADD .env.example /app
ADD chatgpt.js /app
ADD index.js /app
ADD package.json /app
ADD package-lock.json /app

RUN npm i --production

RUN groupadd -r app && useradd -m  -g app app
RUN chown -R app:app /app
USER app

ENTRYPOINT ["node", "index.js"]

