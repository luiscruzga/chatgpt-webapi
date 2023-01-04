import * as dotenv from 'dotenv';
dotenv.config();
import Express from 'express';
import bodyParser from 'body-parser';
import Cors from 'cors';
import chatGPT from 'chatgpt-io';
const AUTH_KEY = process.env.AUTH_KEY;
const PORT = process.env.PORT||8080;
const OPENAI_SESSION_TOKEN = process.env.OPENAI_SESSION_TOKEN;

const EXECUTION_QUEUE=[];
let api;
let isLogged=false;

const app = Express();
app.use(Cors());
app.use(bodyParser.urlencoded({limit: '240mb', extended: true})); 
app.use(bodyParser.json({limit: '240mb'})); 
app.use(bodyParser.raw({type: 'application/octet-stream'}));

if(!OPENAI_SESSION_TOKEN){
    console.error(`Missing OpenAI credentials. 
    Please ensure that either OPENAI_SESSION_TOKEN are set in your environment variables.`);
}

if(!AUTH_KEY){
    console.warn("Auth key not set! Everyone can access this instance.")
}


async function loopExecution() {
    if (EXECUTION_QUEUE.length > 0) {
        const next = EXECUTION_QUEUE.shift();
        await next();
    }
    setTimeout(loopExecution, 5000);
}
loopExecution();

const initChatgpt = async() => {
    try {
        api = new chatGPT(OPENAI_SESSION_TOKEN);
        
        await api.waitForReady();
        isLogged = true;
        console.log('GPTChat init');
        return true;
    } catch (err) {
        console.log(err);
        return err;
    }
}

initChatgpt();

const handleRequest=async (authKey,message,conversationId)=>{
    if(!message) throw "No message specified";
    if (AUTH_KEY && authKey !== AUTH_KEY) {
        throw "Invalid key";
    }
    console.log("Request",message, conversationId);
    
    let response;
    if (conversationId) response = await api.ask(message, conversationId);
    else response = await api.ask(message);
    console.log('Response length', response.length);
    return response;
}

app.post('/chat', async (req, res) => {
    EXECUTION_QUEUE.push(async ()=>{
        res.contentType('application/json');
        try{        
            const response = await handleRequest(req.body.authKey,req.body.message, req.body.conversationId);
            res.send({response:response});
        }catch(e){
            console.log('ERROR: ', e);
            res.send({error:e});
        }
        res.end();
    });
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
});