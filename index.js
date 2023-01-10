import * as dotenv from 'dotenv';
dotenv.config();
import showdown from 'showdown';
import fastify from 'fastify';
import ChatGPT from './chatgpt.js';
const AUTH_KEY = process.env.AUTH_KEY;
const PORT = process.env.PORT||8080;
const OPENAI_SESSION_TOKEN = process.env.OPENAI_SESSION_TOKEN;

const app = fastify();
app.server.setTimeout(120000);

if (!AUTH_KEY){
  console.warn("Auth key not set! Everyone can access this instance.");
}

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const replaceAll = (str, term, replacement) => str.replace(new RegExp(escapeRegExp(term), 'g'), replacement).trim();

const diffSeconds = (dt2, dt1) => {
  let diff =(dt2.getTime() - dt1.getTime()) / 1000;
  return Math.abs(Math.round(diff));
}

app.post('/chat', async (req, res) => {
  try {
    const { sessiontoken } = req.headers;
    const { authKey, message, conversationId, formatToHtml } = req.body;

    if (!sessiontoken) return res.status(403).json({ error: 'No sessiontoken specified!' });
    if (!message) throw "No message specified!";
    if (AUTH_KEY && authKey !== AUTH_KEY) throw "Invalid key!";
    const startDate = new Date();

    // Init session
    const bot = {};
    bot.instance = new ChatGPT(sessiontoken);
    await bot.instance.waitForReady();
    console.log('GPTChat init');
    console.log("Request", message, conversationId);

    let response;
    if (conversationId) response = await bot.instance.ask(message, conversationId);
    else response = await bot.instance.ask(message);

    if (!response) throw "Failed to send the question. Please try again later.";
    console.log('Response length', response.length);

    bot.instance.disconnect();
    delete bot.instance;
    
    if (formatToHtml) {
      const converter = new showdown.Converter();
      let responseFormat = replaceAll(response, `\n`, `
`)
      responseFormat = converter.makeHtml(responseFormat);
      const endDate = new Date();
      const finalTime = diffSeconds(startDate, endDate);
      console.log('[Duracion Total]: ', finalTime);
      res.send({response, responseFormat});
    } else {
      const endDate = new Date();
      const finalTime = diffSeconds(startDate, endDate);
      console.log('[Duracion Total]: ', finalTime);
      res.send({response:response});
    }
  } catch(e) {
    console.log('ERROR: ', e);
    res.send({error:e});
  }
  res.end();
});

app.listen({ port: PORT }, () => {
  console.log(`App listening on port ${PORT}`)
});