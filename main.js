import Express from 'express';
import Cors from 'cors';
import { ChatGPTAPI, getOpenAIAuth } from 'chatgpt'
import Process from 'process';
const AUTH_KEY=process.env.AUTH_KEY;
const PORT =  process.env.PORT||8080;
const OPENAI_EMAIL= Process.env.OPENAI_EMAIL;
const OPENAI_PASSWORD=Process.env.OPENAI_PASSWORD;
const OPENAI_SESSION_TOKEN=Process.env.OPENAI_SESSION_TOKEN;
let GPT;

if(!OPENAI_SESSION_TOKEN&&(!OPENAI_EMAIL||!OPENAI_PASSWORD)){
    console.error(`Missing OpenAI credentials. 
    Please ensure that either OPENAI_EMAIL and OPENAI_PASSWORD or OPENAI_SESSION_TOKEN are set in your environment variables.`);
}

if(!AUTH_KEY){
    console.warn("Auth key not set! Everyone can access this instance.")
}

async function getChatGPT() {
    if(!OPENAI_SESSION_TOKEN&&(!OPENAI_EMAIL||!OPENAI_PASSWORD)){
        throw `Missing OpenAI credentials. 
        Please ensure that either OPENAI_EMAIL and OPENAI_PASSWORD or OPENAI_SESSION_TOKEN are set in your environment variables.`;
    }
   
    if(GPT){
        try{
            await GPT.ensureAuth();
        }catch(e){
            GPT=null;
        }
    }
    if(GPT)return GPT;

    const loginData=OPENAI_SESSION_TOKEN?{}:{
        email: OPENAI_EMAIL,
        password: OPENAI_PASSWORD
    };
    
    const openAIAuth = await getOpenAIAuth(loginData);

    if(OPENAI_SESSION_TOKEN) openAIAuth.sessionToken=OPENAI_SESSION_TOKEN;
    
  
    GPT = new ChatGPTAPI({ ...openAIAuth });
    await GPT.ensureAuth();
   
    return GPT;
}



const app = Express();
app.use(Cors());
app.use(Express.json());

const handleRequest=async (authKey,message,conversationId)=>{
    if(!message) throw "No message specified";
    if (AUTH_KEY && authKey !== AUTH_KEY) {
        throw "Invalid key";
    }
    console.log("Request",message);
    const api = await getChatGPT();
    console.log("Authenticated");

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

app.post('/', async (req, res) => {
    res.contentType('application/json');
    try{        
        const response = await handleRequest(req.body.authKey,req.body.message, req.body.conversationId);
        req.send({response:response});
    }catch(e){
        req.send({error:e});
    }
    req.end();
});

app.get('/', async (req, res) => {
    res.contentType('application/json');
    try{
        const response = await handleRequest(req.query.authKey,req.query.message,req.query.conversationId);
        res.send({response:response});
    }catch(e){
        res.send({error:e});
    }
    res.end();
});

app.listen(PORT);
console.info(`Server started on port ${PORT}`);
