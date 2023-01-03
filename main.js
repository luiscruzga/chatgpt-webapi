import * as dotenv from 'dotenv';
dotenv.config();
import Express from 'express';
import Cors from 'cors';
import { ChatGPTAPIBrowser } from 'chatgpt'
const AUTH_KEY = process.env.AUTH_KEY;
const PORT = process.env.PORT||8080;
const OPENAI_EMAIL = process.env.OPENAI_EMAIL;
const OPENAI_PASSWORD = process.env.OPENAI_PASSWORD;

const EXECUTION_QUEUE=[];
let api;
let isLogged=false;

if(!OPENAI_EMAIL||!OPENAI_PASSWORD){
    console.error(`Missing OpenAI credentials. 
    Please ensure that either OPENAI_EMAIL and OPENAI_PASSWORD or OPENAI_SESSION_TOKEN are set in your environment variables.`);
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
        api = new ChatGPTAPIBrowser({ 
            email: process.env.OPENAI_EMAIL,
            password: process.env.OPENAI_PASSWORD,
            isGoogleLogin: process.env.isGoogleLogin,
            debug: false,
            minimize: true
        });
        
        await api.initSession();
        isLogged = true;
        console.log('GPTChat init');
        return true;
    } catch (err) {
        console.log(err);
        return err;
    }
}

initChatgpt();

const app = Express();
app.use(Cors());
app.use(Express.json());

const handleRequest=async (authKey,message,conversationId)=>{
    if(!message) throw "No message specified";
    if (AUTH_KEY && authKey !== AUTH_KEY) {
        throw "Invalid key";
    }
    console.log("Request",message);
    
    let conversation=api;
    if(conversationId){
        console.log("Get conversation with id",conversationId);
        conversation=await api.getConversation({
            conversationId:conversationId
        });
    }
    
    const response = await conversation.sendMessage(message);
    console.log("Response",response);
    return response;  
}

app.post('/chat', async (req, res) => {
    EXECUTION_QUEUE.push(async ()=>{
        res.contentType('application/json');
        try{        
            const response = await handleRequest(req.body.authKey,req.body.message, req.body.conversationId);
            res.send({response:response});
        }catch(e){
            res.send({error:e});
        }
        res.end();
    });
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
});