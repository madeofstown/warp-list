import { bedrockServer } from "bdsx";

bedrockServer.open.on(()=>{
    require('./playerlist');
    require('./tdtp');
    require('./warplist')
});

