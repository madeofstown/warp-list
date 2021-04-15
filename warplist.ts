
import { Actor, bedrockServer, command, DimensionId, ServerPlayer } from 'bdsx';
import { RelativeFloat, Vec3 } from 'bdsx/bds/blockpos';
import { ActorWildcardCommandSelector, CommandPermissionLevel } from 'bdsx/bds/command';
import { Dimension } from 'bdsx/bds/dimension';
import { CustomForm, FormButton, FormDropdown, FormInput, FormStepSlider, ModalForm, SimpleForm } from 'bdsx/bds/form';
import { CxxString, int32_t } from 'bdsx/nativetype';
import fs = require('fs');
import { connectionList } from './playerlist'; 
import { tdTeleport, RelPos } from './tdtp'; 
const perms = require(`${__dirname}/perms.json`);
let warpListGUI: boolean = true;    /* if 'true', uses a form-based GUI for '/warp list' command response */
let dbFile = "warplist.json";   /* database file location */
let warpDB: any = []
let system = server.registerSystem(0,0);
let homename: string = '§5HOME';

// Load Database File on Server Start
fs.readFile(dbFile, (err, data: any) =>{
    console.log('[WARP LIST] Database ' + dbFile + ' LOADED');
    if (data){
        warpDB = JSON.parse(data);
        let _filedata = JSON.stringify(warpDB, null, 2);
        // console.log(_filedata);
    }
});

// Save Database File on Server Shutdown
system.shutdown = function(){
    saveToFile();
}

bedrockServer.close.on(() => {
    saveToFile();
});

// Register Commands

// /warplist
command.register('warplist', '§bList§7 your Warp Points.', perms.warpList).overload((param, origin, output) => {
    if (perms.formGUI == true) {
        warpListForm(origin.getName());
    } else {
        warpList(origin.getName())
    }
},{});

// /warpedit <warpName> [newWarpName] [newListPos]
command.register('warpedit', '§9Edit§7 a Warp Point.', perms.warpEdit).overload((param, origin, output) => {
    let listIndex = param.newListPos;
    let newName = param.newWarpName;
    if (newName == "") { newName = param.warpName};
    if (param.newListPos !== undefined) { listIndex = param.newListPos - 1 };
    if (param.newWarpName !== undefined || param.newListPos !== undefined) {
        warpEdit(origin.getName(), param.warpName, newName, listIndex, perms.formGUI);
    } else if (perms.formGUI == true) { 
        let originXuid = connectionList.nXXid.get(origin.getName());
        let dbObject = warpDB.find((obj: { xuid: string; }) => obj.xuid == originXuid);
        let dbIndex = warpDB.indexOf(dbObject);
        let warpObject = dbObject.warp.find((obj: { name: string; }) => obj.name == param.warpName);
        let warpIndex = warpDB[dbIndex].warp.indexOf(warpObject);
        warpItemForm(origin.getName(), warpIndex)
    }
},{warpName: CxxString, newWarpName: [CxxString, true], newListPos: [int32_t, true]})

// /warpdel <warpName>
command.register('warpdel', '§cDelete§7 a Warp Point.', perms.warpDel).overload((param, origin, output) => {
    if(param.warpName != undefined) { warpDel(origin.getName(), param.warpName, perms.formGUI) };
},{warpName: CxxString});

// /warpto <warpName>
command.register('warpto', '§aWarp§7 to a Warp Point.', perms.warpTo).overload((param, origin, _output) => {
    if(param.warpName != undefined) { warpTo(origin.getName(), param.warpName) };
},{warpName: CxxString});

// /warpset <warpName>
command.register('warpset', '§eSet§7 a Warp Point.', perms.warpSet).overload((param, origin, _output) => {
    let cmdPos: Vec3 = origin.getWorldPosition()
    let dimId = origin.getDimension().getDimensionId()
    warpAdd(origin.getName(), param.warpName, new RelPos(cmdPos.x), new RelPos(cmdPos.y), new RelPos(cmdPos.z), dimId)
},{warpName: CxxString});

// /warpadd <playerName> <warpName> <x> <y> <z> <dimensionId>
command.register('warpadd', '§6Add§7 a Warp Point for any player at any position.', perms.warpAdd).overload((param, origin, _output) => {
    for (const actor of param.playerName.newResults(origin)) {
        let playerName = actor.getName();
        warpAdd(playerName, param.warpName, param.x, param.y, param.z, param.DimensionId)}
},{playerName: ActorWildcardCommandSelector, warpName: CxxString, x: RelativeFloat, y: RelativeFloat, z: RelativeFloat, DimensionId: int32_t}) 

// /sethome
command.register('sethome', `§eSet§7 your ${homename}§r§o§7 Warp Point.`, perms.setHome).overload((_param, origin, _output)=>{
    let cmdPos = origin.getWorldPosition()
    let dimId = origin.getDimension().getDimensionId()
    console.log(dimId)
    warpAdd(origin.getName(), homename, new RelPos(cmdPos.x), new RelPos(cmdPos.y), new RelPos(cmdPos.z), dimId)
},{});

// /home
command.register('home', `§aWarp§7 to your ${homename}§r§o§7 Warp Point.`, perms.home).overload((_param, origin, _output)=>{
    warpTo(origin.getName(), homename);
},{});

// Functions

function tellRaw(playerName: string, text: string){
    system.executeCommand(`/tellraw ${playerName} {"rawtext":[{"text":"${text}"}]}`, () => {});
}

function saveToFile(dbObject: object = warpDB, file: string = dbFile){
    let filedata = JSON.stringify(dbObject, null, 2);
    fs.writeFile(file, filedata, () => {
        console.log('[WARP LIST] Database ' + dbFile + ' SAVED');
    });
}

function warpAdd(playerName: string, warpName: string, x: RelPos, y: RelPos, z: RelPos, dimensionId?: DimensionId,){
    let originActor: Actor = connectionList.nXNet.get(playerName).getActor();
    let originXuid = connectionList.nXXid.get(playerName);
    let dbObject = warpDB.find((obj: { xuid: string; }) => obj.xuid == originXuid);
    let xPos: number;
    let yPos: number;
    let zPos: number;
    let dimId: number;

    if (x.is_relative == true) {
        xPos = originActor.getPosition().x + x.value
    } else {xPos = x.value}
    if (y.is_relative == true) {
        yPos = originActor.getPosition().y + y.value - 1.62
    } else {yPos = y.value}
    if (z.is_relative == true) {
        zPos= originActor.getPosition().z + z.value
    } else {zPos= z.value}
    
    if (dimensionId != undefined && dimensionId >= 0 && dimensionId <= 2) {
        dimId = parseInt(dimensionId.toFixed(0))
    } else { dimId = originActor.getDimensionId()}

    let warpEntry = new WarpDBEntry(warpName, dimId, xPos, yPos, zPos);
    
    if (warpName != undefined && warpName != '' && warpName != null ) {
        tellRaw(playerName, '§e§l[WARP LIST]');
        if (dbObject != undefined){
            let dbIndex = warpDB.indexOf(dbObject);
            let warpObject = dbObject.warp.find((obj: { name: string; }) => obj.name == warpName);

            if (warpObject != undefined){
                tellRaw(playerName, `§eExisting §3§o${warpObject.name}§r§e\n    [§f${DimensionId[warpObject.dimId]} §e@ §4${warpObject.x.toFixed(1)} §a${warpObject.y.toFixed(1)} §9${warpObject.z.toFixed(1)}§e]`);
                tellRaw(playerName, `§cOverwriting §3§o${warpName}§r§e\n    [§f${DimensionId[dimId]} §e@ §4${xPos.toFixed(1)} §a${yPos.toFixed(1)} §9${zPos.toFixed(1)}§e]`);
                let warpIndex = warpDB[dbIndex].warp.indexOf(warpObject);
                warpDB[dbIndex].warp[warpIndex] = warpEntry;

            } else {
                tellRaw(playerName, `§eSet §3§o${warpName}§r§e\n    [§f${DimensionId[dimId]} §e@ §4${xPos.toFixed(1)} §a${yPos.toFixed(1)} §9${zPos.toFixed(1)}§e]`);
                if (warpName == homename){
                    warpDB[dbIndex].warp.unshift(warpEntry);
                } else {
                warpDB[dbIndex].warp.push(warpEntry);
                }
            }

        } else {
            tellRaw(playerName, `§eSet §3§o${warpName}§r§e\n    [§f${DimensionId[dimId]} §e@ §4${xPos.toFixed(1)} §a${yPos.toFixed(1)} §9${zPos.toFixed(1)}§e]`);
            warpDB.push(new PlayerDBEntry(originXuid, playerName, warpEntry));
        }
        tellRaw(playerName, '§e§l* * * * * * *');
        // Save warpDB to dbFile
        saveToFile();
    }
}


function warpEdit(playerName: string, warpName: string, newWarpName: string = warpName, newListIndex?: number, formConfirm?: boolean){
    let originXuid = connectionList.nXXid.get(playerName);
    let dbObject = warpDB.find((obj: { xuid: string; }) => obj.xuid == originXuid);
    let dbIndex: number = warpDB.indexOf(dbObject);
    let warpObject = dbObject.warp.find((obj: { name: string; }) => obj.name == warpName);
    let warpIndex: number = warpDB[dbIndex].warp.indexOf(warpObject);
    let newWarpNameObject = dbObject.warp.find((obj: { name: string; }) => obj.name == newWarpName);
    
    if (warpName != undefined && warpName != '' && warpName != null ) {
        if (dbObject != undefined){
            if (warpObject != undefined){
                if (formConfirm == true){
                    let originNetID = connectionList.nXNet.get(playerName)
                    let delConfirmForm = new ModalForm('§0§l! - ! - ! - [WARP LIST] - ! - ! - !', `Are you sure you want to §9§lEDIT§r:\n\n§3§o${warpName}§r ?`);
                    delConfirmForm.setButtonCancel("§lCANCEL");
                    delConfirmForm.setButtonConfirm("§9§lEDIT");
                    delConfirmForm.sendTo(originNetID, (data, originNetID)=>{
                        if (data.response !== undefined && data.response !== null && data.response !== false){
                            tellRaw(playerName, '§e§l[WARP LIST]');
                            if (newWarpName && newWarpName != '' && newWarpName != null && warpName != newWarpName){
                                if (warpName != newWarpName && (warpName == homename || newWarpName == homename)) {
                                    newWarpNameObject = dbObject.warp.find((obj: { name: string; }) => obj.name == warpName);
                                    tellRaw(playerName, `§eCan't rename §3§o${homename}`);
                                }
                                else if (warpName != newWarpName && newWarpNameObject != undefined) {
                                    newWarpNameObject = dbObject.warp.find((obj: { name: string; }) => obj.name == warpName);
                                    tellRaw(playerName, `§eExisting §3§o${newWarpName}`);
                                } else {
                                    warpDB[dbIndex].warp[warpIndex].name = newWarpName;
                                    newWarpNameObject = dbObject.warp.find((obj: { name: string; }) => obj.name == newWarpName);
                                    tellRaw(playerName, `§3§o${warpName}§r§e now\n    §r§3§o${newWarpName}`);
                                }
                            }
                            if (newListIndex != undefined && newListIndex != null) {
                                if (newListIndex != warpIndex) {
                                    if(newListIndex < warpIndex) {
                                        warpDB[dbIndex].warp.splice(warpIndex, 1);
                                        warpDB[dbIndex].warp.splice(newListIndex, 0, newWarpNameObject);
                                        tellRaw(playerName, `§3§o${warpDB[dbIndex].warp[newListIndex].name} §e@ position:\n    ${newListIndex + 1}`);
                                    } else if (newListIndex > warpIndex) {
                                        warpDB[dbIndex].warp.splice(newListIndex + 1, 0, newWarpNameObject);
                                        warpDB[dbIndex].warp.splice(warpIndex, 1);
                                        tellRaw(playerName, `§3§o${warpDB[dbIndex].warp[newListIndex].name} §e@ position:\n    ${newListIndex + 1}`); 
                                    }        
                                } else {
                                    tellRaw(playerName, `§3§o${warpDB[dbIndex].warp[newListIndex].name} §e@ position:\n    ${newListIndex + 1}`);
                                }
                            }
                            tellRaw(playerName, '§e§l* * * * * * *');
                            saveToFile();
                        }
                    });
                } else if (formConfirm == false) { 
                    tellRaw(playerName, '§e§l[WARP LIST]');
                    if (newWarpName && newWarpName != '' && newWarpName != null && warpName != newWarpName){
                        if (warpName != newWarpName && (warpName == homename || newWarpName == homename)) {
                            newWarpNameObject = dbObject.warp.find((obj: { name: string; }) => obj.name == warpName);
                            tellRaw(playerName, `§eCan't rename §3§o${homename}`);
                        }
                        else if (warpName != newWarpName && newWarpNameObject != undefined) {
                            newWarpNameObject = dbObject.warp.find((obj: { name: string; }) => obj.name == warpName);
                            tellRaw(playerName, `§eExisting §3§o${newWarpName}`);
                        } else {
                            warpDB[dbIndex].warp[warpIndex].name = newWarpName;
                            newWarpNameObject = dbObject.warp.find((obj: { name: string; }) => obj.name == newWarpName);
                            tellRaw(playerName, `§3§o${warpName}§r§e now\n    §r§3§o${newWarpName}`);
                        }
                    }
                    if (newListIndex != undefined && newListIndex != null) {
                        if (newListIndex != warpIndex) {
                            if(newListIndex < warpIndex) {
                                warpDB[dbIndex].warp.splice(warpIndex, 1);
                                warpDB[dbIndex].warp.splice(newListIndex, 0, newWarpNameObject);
                                tellRaw(playerName, `§3§o${warpDB[dbIndex].warp[newListIndex].name} §e@ position:\n    ${newListIndex + 1}`);
                            } else if (newListIndex > warpIndex) {
                                warpDB[dbIndex].warp.splice(newListIndex + 1, 0, newWarpNameObject);
                                warpDB[dbIndex].warp.splice(warpIndex, 1);
                                tellRaw(playerName, `§3§o${warpDB[dbIndex].warp[newListIndex].name} §e@ position:\n    ${newListIndex + 1}`); 
                            }        
                        } else {
                            tellRaw(playerName, `§3§o${warpDB[dbIndex].warp[newListIndex].name} §e@ position:\n    ${newListIndex + 1}`);
                        }
                    }
                    tellRaw(playerName, '§e§l* * * * * * *');
                    saveToFile();
                }
            } else {
                tellRaw(playerName, '§e§l[WARP LIST]');
                tellRaw(playerName, `§eNo warp called: §3§o${warpName}`);
                tellRaw(playerName, '§e§l* * * * * * *');
            }

        } else {
            tellRaw(playerName, '§e§l[WARP LIST]');
            tellRaw(playerName, '§c0 §gWarp points set');
            tellRaw(playerName, '§e§l* * * * * * *');
        }
    }
}

function warpDel(playerName: string, warpName: string, formConfirm?: boolean){
    let originXuid = connectionList.nXXid.get(playerName);
    let dbObject = warpDB.find((obj: { xuid: string; }) => obj.xuid == originXuid);
    let dbIndex: number = warpDB.indexOf(dbObject);
    let warpObject = dbObject.warp.find((obj: { name: string; }) => obj.name == warpName);
    let warpIndex: number = warpDB[dbIndex].warp.indexOf(warpObject);
    
    if (warpName != undefined && warpName != '' && warpName != null ) {
        if (dbObject != undefined){
            if (warpObject != undefined){
                if (formConfirm == true){
                    let originNetID = connectionList.nXNet.get(playerName)
                    let delConfirmForm = new ModalForm('§0§l! - ! - ! - [WARP LIST] - ! - ! - !', `Are you sure you want to §c§lDELETE§r:\n\n§3§o${warpName}§r \u203D\u203D\u203D`);
                    delConfirmForm.setButtonCancel("§lCANCEL");
                    delConfirmForm.setButtonConfirm("§c§lDELETE");
                    delConfirmForm.sendTo(originNetID, (data, originNetID)=>{
                        if (data.response !== undefined && data.response !== null && data.response !== false){
                            console.log(data.response);
                            warpDB[dbIndex].warp.splice(warpIndex, 1);
                            tellRaw(playerName, '§e§l[WARP LIST]');
                            tellRaw(playerName, `§eDeleted §3§o${warpObject.name}§r§e\n    [§f${DimensionId[warpObject.dimId]} §e@ §4${warpObject.x.toFixed(1)} §a${warpObject.y.toFixed(1)} §9${warpObject.z.toFixed(1)}§e]`);
                            tellRaw(playerName, '§e§l* * * * * * *');
                            saveToFile();
                        }
                    });
                } else {
                    warpDB[dbIndex].warp.splice(warpIndex, 1);
                    tellRaw(playerName, '§e§l[WARP LIST]');
                    tellRaw(playerName, `§eDeleted §3§o${warpObject.name}§r§e\n    [§f${DimensionId[warpObject.dimId]} §e@ §4${warpObject.x.toFixed(1)} §a${warpObject.y.toFixed(1)} §9${warpObject.z.toFixed(1)}§e]`);
                    tellRaw(playerName, '§e§l* * * * * * *');
                    saveToFile();
                }
            } else {
                tellRaw(playerName, '§e§l[WARP LIST]');
                tellRaw(playerName, `§eNo warp called: §3§o${warpName}`);
                tellRaw(playerName, '§e§l* * * * * * *');
            }

        } else {
            tellRaw(playerName, '§e§l[WARP LIST]');
            tellRaw(playerName, '§c0 §gWarp points set');
            tellRaw(playerName, '§e§l* * * * * * *');
        }
    }
}

function warpTo(playerName: string, warpName: string){
    let originXuid = connectionList.nXXid.get(playerName);
    let originActor: ServerPlayer | null = connectionList.nXNet.get(playerName).getActor();
    let dbObject = warpDB.find((obj: { xuid: string; }) => obj.xuid == originXuid);

    if (warpName != undefined && warpName != '' && warpName != null ) {
        tellRaw(playerName, '§e§l[WARP LIST]');
        if (dbObject != undefined){
            let warpObject = dbObject.warp.find((obj: { name: string; }) => obj.name == warpName);

            if (warpObject != undefined){
                if (originActor){
                    tdTeleport(originActor, {value: warpObject.x}, {value: warpObject.y}, {value: warpObject.z}, warpObject.dimId);
                    tellRaw(playerName, `§eWarped to §3§o${warpObject.name}§r§e\n    [§f${DimensionId[warpObject.dimId]} §e@ §4${warpObject.x.toFixed(1)} §a${warpObject.y.toFixed(1)} §9${warpObject.z.toFixed(1)}§e]`);
                } else {
                    tellRaw(playerName, `§cNO ACTOR FOR §3${playerName}`)
                }
            } else {
                tellRaw(playerName, `§eNo warp called: §3§o${warpName}`);
            }

        } else {
            tellRaw(playerName, '§c0 §gWarp points set');
        }
        tellRaw(playerName, '§e§l* * * * * * *');
    }
}

function warpList(playerName: string){
    let originXuid = connectionList.nXXid.get(playerName);
    let dbObject = warpDB.find((obj: { xuid: string; }) => obj.xuid == originXuid);

    tellRaw(playerName, '§e§l[WARP LIST]');
    if (dbObject != undefined){
        if (dbObject.warp.length > 0){
            for (let i = 0; i < dbObject.warp.length; i++) {
                tellRaw(playerName , `§e[${i + 1}] §3§o${dbObject.warp[i].name}§r§e\n    [§f${DimensionId[dbObject.warp[i].dimId]} §e@ §4${dbObject.warp[i].x.toFixed(1)} §a${dbObject.warp[i].y.toFixed(1)} §9${dbObject.warp[i].z.toFixed(1)}§e]`);
            }

        } else {
            tellRaw(playerName, '§c0 §gWarp points set');
        }

    } else {
        tellRaw(playerName, '§c0 §gWarp points set');
    }
    tellRaw(playerName, '§e§l* * * * * * *');
}

function warpItemForm(playerName: string, warpIndex: number) {
    let playerXuid = connectionList.nXXid.get(playerName);
    let playerNetID = connectionList.nXNet.get(playerName);
    let dbObject = warpDB.find((obj: { xuid: string; }) => obj.xuid == playerXuid);
    if (dbObject.warp[warpIndex]) { 
        let indexArray: string[] = [];
        for (let i = 0; i < dbObject.warp.length; i++){
            indexArray.push(`${i + 1}`)
        }
        let warpItemForm = new CustomForm('§0§l[WARP LIST]');
        warpItemForm.addComponent(new FormInput("§7§oName:", `${dbObject.warp[warpIndex].name}`, `${dbObject.warp[warpIndex].name}`));
        warpItemForm.addComponent(new FormDropdown("§7§oList Position:", indexArray, warpIndex));
        warpItemForm.addComponent(new FormStepSlider("§7§oAction",["§r§a§lWARP", "§r§9§lEDIT", "§r§c§lDELETE"], 0));
        warpItemForm.sendTo(playerNetID, (data, playerNetID) => {
            if (data.response !== undefined && data.response !== null){
                console.log(data.response);
                if (data.response[2] == 0) {
                    warpTo(playerName, dbObject.warp[warpIndex].name);
                }
                if (data.response[2] == 1) {
                    warpEdit(playerName, dbObject.warp[warpIndex].name, data.response[0], data.response[1], true)
                }
                if (data.response[2] == 2) {
                    warpDel(playerName, dbObject.warp[warpIndex].name, true);
                }
            } 
        })     
    }
    
}

function warpListForm(playerName: string) {
    let playerXuid = connectionList.nXXid.get(playerName);
    let playerNetID = connectionList.nXNet.get(playerName);
    let dbObject = warpDB.find((obj: { xuid: string; }) => obj.xuid == playerXuid);
    let warpListForm = new SimpleForm('§0§l[WARP LIST]')

    if (dbObject != undefined) {
        if (dbObject.warp.length >= 0) {
            for (let i = 0; i < dbObject.warp.length; i++) {
                warpListForm.addButton(new FormButton(`§1§o${dbObject.warp[i].name}§r§8\n[§0${DimensionId[dbObject.warp[i].dimId]} §8@ §4${dbObject.warp[i].x.toFixed(1)} §2${dbObject.warp[i].y.toFixed(1)} §9${dbObject.warp[i].z.toFixed(1)}§8]`));
            }
            warpListForm.sendTo(playerNetID, (data, playerNetID) => {
                if (data.response !== undefined && data.response !== null){
                warpItemForm(playerName, data.response);
                }
            })
        } else {
            tellRaw(playerName, '§e§l[WARP LIST]');
            tellRaw(playerName, '§c0 §gWarp points set');
            tellRaw(playerName, '§e§l* * * * * * *');
        }

    } else {
        tellRaw(playerName, '§e§l[WARP LIST]');
        tellRaw(playerName, '§c0 §gWarp points set');
        tellRaw(playerName, '§e§l* * * * * * *');
    }
}

// Database Entry Classes
class PlayerDBEntry {
    xuid: string;
    name: string;
    warp: WarpDBEntry;
    constructor(xuid: string, name: string, warp?: WarpDBEntry ){
        this.xuid = xuid;
        this.name = name;
        this.warp = [];
        if (warp != undefined){this.warp.push(warp)}
    }
}

class WarpDBEntry {
    [key: string]: any
    constructor(warpName: string, dimensionId: DimensionId, xPos: number, yPos: number, zPos: number){
        this.name = warpName;
        this.dimId = dimensionId;
        this.x = xPos;
        this.y = yPos;
        this.z = zPos;
    }
}
