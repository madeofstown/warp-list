import { events } from "bdsx/event";

events.serverOpen.on(()=>{
    require('./playerlist');
    require('./tdtp');
    require('./warplist')
});

