/**
 * @file warplist2.js
 * @author madeofstown randommouse
 */

 import { bedrockServer } from "bdsx/launcher";
 import { DimensionId } from "bdsx/bds/actor";
 import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
 import { command } from "bdsx/command";
 import { RelativeFloat, Vec3 } from 'bdsx/bds/blockpos';
 import { ActorWildcardCommandSelector } from 'bdsx/bds/command';
 import { CustomForm, FormButton, FormDropdown, FormInput, FormStepSlider, ModalForm, SimpleForm } from 'bdsx/bds/form';
 import { Player } from 'bdsx/bds/player';
 import { events } from 'bdsx/event';
 import { CxxString, int32_t } from 'bdsx/nativetype';
 import fs = require('fs');
 import { connectionList } from './playerlist';
 const dbFile = "warplist.json";
 const perms = require(`${__dirname}/perms.json`);
 let homename: string = '§5HOME';

 /**
  * -- Class Definitions --
  */

 class WarpListDB<T> extends Array<WLPlayerEntry> {
     private constructor(items?: Array<WLPlayerEntry>){
         super(...items!)
     }
     static create<WLPlayerEntry>(): WarpListDB<WLPlayerEntry> {
         return Object.create(WarpListDB.prototype);
     }
     public addPlayer(playerActor: Player, warp?: WLWarpEntry) { /* change to addPlayer(playerActor: Player, warp?: WLWarpEntry) */
         let name = playerActor.getName();
         let xuid = connectionList.nXXid.get(name);
         let playerEntry = new WLPlayerEntry(name, xuid, warp)
         this.push(playerEntry);
         return this
     }
     public getPlayer(playerActor: Player) { /* change to getPlayer(playerActor: Player) */
         let name = playerActor.getName();
         let xuid = connectionList.nXXid.get(name);
         let object = this.find((obj: {xuid: string}) => obj.xuid == xuid)
         if (object != undefined) {
             let index = this.indexOf(object);
             let playerEntry: WLPlayerEntry = Object.create(WLPlayerEntry.prototype);
             return this[index] = Object.assign(playerEntry, object);
         } else {
             return undefined
         }

     }
 }

 class WLPlayerEntry {
     name: string;
     xuid: string;
     warp: WLWarpEntry[]
     constructor(name: string, xuid: string, warp?: WLWarpEntry){
         this.name = name;
         this.xuid = xuid;
         this.warp = [];
         if (warp != undefined){this.warp.push(warp)}
     }
     public addWarp(warpName: string, pos: {x: number, y: number, z: number}, dimensionID: number, first: boolean = false){
         let warpEntry = new WLWarpEntry(warpName, dimensionID, pos.x, pos.y, pos.z);
         if (first == true) {
             this.warp.unshift(warpEntry);
         } else {
             this.warp.push(warpEntry);
         }
         return this
     }
     public delWarp(warpName: string){
         let object = this.warp.find((obj: {name: string}) => obj.name == warpName);
         if (object != undefined) {
             let index = this.warp.indexOf(object);
             this.warp.splice(index, 1);
         }
         return this
     }
     public moveWarp(warpName: string, newIndex: number){
         let object = this.warp.find((obj: {name: string}) => obj.name == warpName);
         if (object != undefined) {
             let index = this.warp.indexOf(object);
             if (newIndex < index) {
                 this.warp.splice(newIndex, 0, this.warp[index]);
                 this.warp.splice(index + 1, 1);
             }
             if (newIndex > index) {
                 this.warp.splice(newIndex + 1, 0, this.warp[index]);
                 this.warp.splice(index, 1);
             }
             return this
         }
     }
     public getWarp(warpName: string){
         let object = this.warp.find((obj: {name: string}) => obj.name == warpName);
         if (object != undefined) {
             let index = this.warp.indexOf(object);
             let warpEntry: WLWarpEntry = Object.create(WLWarpEntry.prototype);
             return this.warp[index] = Object.assign(warpEntry, object);
         } else {
             return undefined
         }
     }
 }

 class WLWarpEntry {
     name: string;
     dimId: number;
     x: number;
     y: number;
     z: number;
     constructor(warpName: string, dimensionId: number, xPos: number, yPos: number, zPos: number){
         this.name = warpName;
         this.dimId = dimensionId;
         this.x = xPos;
         this.y = yPos;
         this.z = zPos;
     }
     public rename(newName: string){
         this.name = newName;
         return this
     }
     public warp(playerActor: Player){
         playerActor.teleport(Vec3.create(this.x, this.y, this.z), this.dimId);
     }
 }

 /**
  * -- Functions --
  */

 function saveToFile(dbObject: WarpListDB<WLWarpEntry> = warpDB, file: string = dbFile){
     let filedata = JSON.stringify(dbObject, null, 4);
     fs.writeFileSync(file, filedata, 'utf8');
     console.log('[WARP LIST] Database ' + dbFile + ' SAVED');
 }

 function loadFromFile(dbObject: WarpListDB<WLWarpEntry> = warpDB, file: string = dbFile){
     try{
         let filedata = fs.readFileSync(file, 'utf8');
         dbObject = Object.assign(dbObject, JSON.parse(filedata));
         console.log('[WARP LIST] Database ' + dbFile + ' LOADED');
     }
     catch(err){
         console.log('[WARP LIST]' + file + ' DOES NOT EXIST');
         // console.log(err);
     }
 }
 function tellRaw(playerName: string, text: string){
     bedrockServer.executeCommand(`/tellraw ${playerName} {"rawtext":[{"text":"${text}"}]}`);
 }
 function warpMsg(playerActor: Player, text: string){
     let playerName = playerActor.getName()
     if (playerName != undefined) {
         tellRaw(playerName, '§e§l[WARP LIST]');
         tellRaw(playerName, text);
         tellRaw(playerName, '§e§l* * * * * * *');
     } else {console.log('[WARP LIST] Error: No Player Name for warpMsg()') }
 }
 function warpTo(playerActor: Player, warpName: string) {
     if (playerActor.isPlayer() == true) {
         if (warpDB.getPlayer(playerActor) != undefined) {
             if (warpDB.getPlayer(playerActor)?.getWarp(warpName) != undefined) {
                 let warpEntry = warpDB.getPlayer(playerActor)?.getWarp(warpName)!
                 if (playerActor.getDimensionId() == warpEntry.dimId) {
                    warpMsg(playerActor, `§eWarped to §3§o${warpEntry.name}§r§e`
                        + `\n    [§f${DimensionId[warpEntry.dimId]} §e@ §4${warpEntry.x.toFixed(1)} §a${warpEntry.y.toFixed(1)} §9${warpEntry.z.toFixed(1)}§e]`);
                    bedrockServer.executeCommand(`teleport ${playerActor.getName()} ${warpEntry.x} ${warpEntry.y} ${warpEntry.z}`);
                 } else if(playerActor.getDimensionId() != warpDB.getPlayer(playerActor)?.getWarp(warpName)?.dimId) {
                    warpMsg(playerActor, `§eWarped to §3§o${warpEntry.name}§r§e`
                        + `\n    [§f${DimensionId[warpEntry.dimId]} §e@ §4${warpEntry.x.toFixed(1)} §a${warpEntry.y.toFixed(1)} §9${warpEntry.z.toFixed(1)}§e]`);
                    warpEntry.warp(playerActor);
                 }
             } else {warpMsg(playerActor, `§eNo warp called: §3§o${warpName}`)}
         } else if (warpDB.getPlayer(playerActor) == undefined) {
             warpMsg(playerActor, '§c0 §gWarp points set')
         }
     } else {console.log('[WARP LIST] Error: No Player for warpTo()')}

 }
 function warpAdd(playerActor: Player, warpName: string, pos: {x: number, y: number, z: number}, dimensionID: number){
     if (playerActor.isPlayer() == true) {
         pos.y = pos.y - 1.62;
         if(warpDB.getPlayer(playerActor) == undefined) {
             warpDB.addPlayer(playerActor)
         }
         if (warpDB.getPlayer(playerActor)?.getWarp(warpName) == undefined) {
             if (warpName != homename) {
                 warpDB.getPlayer(playerActor)?.addWarp(warpName, pos, dimensionID)
             } else if (warpName == homename) {
                 warpDB.getPlayer(playerActor)?.addWarp(warpName, pos, dimensionID, true)
             }
             warpMsg(playerActor, `§eSet §3§o${warpName}§r§e`
                 + `\n    [§f${DimensionId[dimensionID]} §e@ §4${pos.x.toFixed(1)} §a${pos.y.toFixed(1)} §9${pos.z.toFixed(1)}§e]`);
         }
         else if (warpDB.getPlayer(playerActor)?.getWarp(warpName) != undefined) {
             let warpEntry = warpDB.getPlayer(playerActor)!.getWarp(warpName)
             warpMsg(playerActor, `§eExisting §3§o${warpEntry!.name}§r§e`
                     + `\n    [§f${DimensionId[warpEntry!.dimId]} §e@ §4${warpEntry!.x.toFixed(1)} §a${warpEntry!.y.toFixed(1)} §9${warpEntry!.z.toFixed(1)}§e]`
                     + `\n§r§cOverwriting §3§o${warpName}§r§e`
                     + `\n    [§f${DimensionId[dimensionID]} §e@ §4${pos.x.toFixed(1)} §a${pos.y.toFixed(1)} §9${pos.z.toFixed(1)}§e]`);
             warpDB.getPlayer(playerActor)!.getWarp(warpName)!.x = pos.x;
             warpDB.getPlayer(playerActor)!.getWarp(warpName)!.y = pos.y;
             warpDB.getPlayer(playerActor)!.getWarp(warpName)!.z = pos.z;
             warpDB.getPlayer(playerActor)!.getWarp(warpName)!.dimId = dimensionID;
         }
         saveToFile();
     } else {console.log('[WARP LIST] Error: No Player for warpAdd()')}
 }
 function warpEdit(playerActor: Player, warpName: string, newWarpName: string = warpName, newListIndex?: number, deleteWarp: boolean = false, confirmForm: boolean = perms.formGUI ){
     let warpEntry = warpDB.getPlayer(playerActor)?.getWarp(warpName);
     let listIndex = warpDB.getPlayer(playerActor)?.warp.indexOf(warpDB.getPlayer(playerActor)?.getWarp(warpName)!);
     if (newListIndex == undefined) {newListIndex = listIndex};
     let playerNetID = playerActor.getNetworkIdentifier();
     let editConfirmForm = new ModalForm('§0§l! - ! - ! - [WARP LIST] - ! - ! - !', `Are you sure you want to §9§lEDIT§r:\n\n§3§o${warpName}§r ?`);
     editConfirmForm.setButtonCancel("§lCANCEL");
     editConfirmForm.setButtonConfirm("§9§lEDIT");
     let delConfirmForm = new ModalForm('§0§l! - ! - ! - [WARP LIST] - ! - ! - !', `Are you sure you want to §c§lDELETE§r:\n\n§3§o${warpEntry!.name}§r \u203D\u203D\u203D`);
     delConfirmForm.setButtonCancel("§lCANCEL");
     delConfirmForm.setButtonConfirm("§c§lDELETE");

     if(playerActor.isPlayer() == true) {
         if (warpEntry != undefined) {
             if (newWarpName != warpName && warpDB.getPlayer(playerActor)?.getWarp(newWarpName) == undefined && deleteWarp == false) {
                 if(newListIndex != listIndex && warpName != homename){
                     if (confirmForm == true) {
                         editConfirmForm.sendTo(playerNetID, (data, playerNetID)=>{
                             if (data.response !== undefined && data.response !== null && data.response !== false) {
                                 warpDB.getPlayer(playerActor)?.moveWarp(warpName, newListIndex!)?.getWarp(warpName)?.rename(newWarpName);
                                 warpMsg(playerActor, `§3§o${warpName}§r§e now\n§r§3§o${newWarpName} §e@ position:\n    ${newListIndex! + 1}`);
                                 saveToFile();
                             }
                         });
                     }
                     if (confirmForm == false) {
                         warpDB.getPlayer(playerActor)?.moveWarp(warpName, newListIndex!)?.getWarp(warpName)?.rename(newWarpName);
                         warpMsg(playerActor, `§3§o${warpName}§r§e now\n§r§3§o${newWarpName} §e@ position:\n    ${newListIndex! + 1}`);
                         saveToFile();
                     }
                 } else if (newListIndex == listIndex && warpName != homename) {
                     if (confirmForm == true) {
                         editConfirmForm.sendTo(playerNetID, (data, playerNetID)=>{
                             if (data.response !== undefined && data.response !== null && data.response !== false) {
                                 warpDB.getPlayer(playerActor)?.getWarp(warpName)?.rename(newWarpName);
                                 warpMsg(playerActor, `§3§o${warpName}§r§e now\n    §r§3§o${newWarpName}`);
                                 saveToFile();
                             }
                         });
                     }
                     if (confirmForm == false) {
                         warpDB.getPlayer(playerActor)?.getWarp(warpName)?.rename(newWarpName);
                         warpMsg(playerActor, `§3§o${warpName}§r§e now\n    §r§3§o${newWarpName}`);
                         saveToFile();
                     }
                 } else if (warpName == homename){warpMsg(playerActor, `§eCan't rename §3§o${homename}`)}
             } else if (warpDB.getPlayer(playerActor)?.getWarp(newWarpName) != undefined && newWarpName != warpName && deleteWarp == false) {warpMsg(playerActor, `§eExisting §3§o${newWarpName}`)
             } else if (newListIndex != listIndex && deleteWarp == false) {
                 if (confirmForm == true) {
                     editConfirmForm.sendTo(playerNetID, (data, playerNetID)=>{
                         if (data.response !== undefined && data.response !== null && data.response !== false) {
                             warpDB.getPlayer(playerActor)?.moveWarp(warpName, newListIndex!);
                             warpMsg(playerActor,  `§3§o${warpName} §e@ position:\n    ${newListIndex! + 1}`);
                             saveToFile();
                         }
                     });
                 }
                 if (confirmForm == false) {
                     warpDB.getPlayer(playerActor)?.moveWarp(warpName, newListIndex!);
                     warpMsg(playerActor,  `§3§o${warpName} §e@ position:\n    ${newListIndex! + 1}`);
                     saveToFile();
                 }
             } else if (deleteWarp == true) {
                 if (confirmForm == true) {
                     delConfirmForm.sendTo(playerNetID, (data, playerNetID)=>{
                         if (data.response !== undefined && data.response !== null && data.response !== false){
                             warpDB.getPlayer(playerActor)!.delWarp(warpEntry!.name);
                             warpMsg(playerActor, `§eDeleted §3§o${warpEntry!.name}§r§e`
                             + `\n    [§f${DimensionId[warpEntry!.dimId]} §e@ §4${warpEntry!.x.toFixed(1)} §a${warpEntry!.y.toFixed(1)} §9${warpEntry!.z.toFixed(1)}§e]`);
                             saveToFile();
                         }
                     });
                 }
                 if (confirmForm == false) {
                     warpDB.getPlayer(playerActor)!.delWarp(warpEntry!.name);
                     warpMsg(playerActor, `§eDeleted §3§o${warpEntry!.name}§r§e`
                     + `\n    [§f${DimensionId[warpEntry!.dimId]} §e@ §4${warpEntry!.x.toFixed(1)} §a${warpEntry!.y.toFixed(1)} §9${warpEntry!.z.toFixed(1)}§e]`);
                     saveToFile();
                 }
             }

         } else {warpMsg(playerActor, `§eNo warp called: §3§o${warpName}`)}
     } else {console.log('[WARP LIST] Error: No Player for warpEdit()')}
 }




 /**
  * -- Create Database object and load JSON --
  */

 let warpDB = WarpListDB.create<WLPlayerEntry>()
 loadFromFile();
 console.log(warpDB);

 /**
  * -- Save Database ojbect to JSON file on shutdown --
  */

 events.serverClose.on(() => {
     saveToFile();
 });

 /**
  * -- Command hooking and processing --
  */

 // /warplist
 command.register('warplist', '§bList§7 your Warp Points.', perms.warpList).overload((param, origin, output) => {
     if (origin.getName() != undefined && origin.getName() != '!Â§r') {
         let playerNetID: NetworkIdentifier = connectionList.nXNet.get(origin.getName());
         let playerActor: Player = playerNetID.getActor() as Player;
         if (playerActor != null) {
             let playerName = playerActor.getName();
             let playerEntry = warpDB.getPlayer(playerActor)
             if (playerEntry != undefined && playerEntry.warp.length > 0) {
                 if (perms.formGUI == false) {
                     tellRaw(playerName, '§e§l[WARP LIST]');
                     for (let i = 0; i < playerEntry.warp.length; i++) {
                         tellRaw(playerName , `§e[${i + 1}] §3§o${playerEntry.warp[i].name}§r§e`
                         + `\n    [§f${DimensionId[playerEntry.warp[i].dimId]} §e@ §4${playerEntry.warp[i].x.toFixed(1)} §a${playerEntry.warp[i].y.toFixed(1)} §9${playerEntry.warp[i].z.toFixed(1)}§e]`);
                     }
                     tellRaw(playerName, '§e§l* * * * * * *');
                 }
                 if (perms.formGUI == true) {
                     let warpListForm = new SimpleForm('§0§l[WARP LIST]');
                     for (let i = 0; i < playerEntry.warp.length; i++) {
                         warpListForm.addButton(new FormButton(`§1§o${playerEntry.warp[i].name}§r§8`
                         + `\n[§0${DimensionId[playerEntry.warp[i].dimId]} §8@ §4${playerEntry.warp[i].x.toFixed(1)} §2${playerEntry.warp[i].y.toFixed(1)} §9${playerEntry.warp[i].z.toFixed(1)}§8]`));
                     }
                     warpListForm.sendTo(playerNetID, (data, playerNetID) => {
                         if (data.response !== undefined && data.response !== null){
                             let warpIndex = data.response;
                             let warpEntry = playerEntry?.getWarp(playerEntry!.warp[warpIndex].name)
                             if (playerEntry!.warp[warpIndex]) {
                                 let indexArray: string[] = [];
                                 for (let i = 0; i < playerEntry!.warp.length; i++){
                                     indexArray.push(`${i + 1}`)
                                 }
                                 let warpItemForm = new CustomForm('§0§l[WARP LIST]');
                                 warpItemForm.addComponent(new FormInput("§7§oName:", `${warpEntry!.name}`, `${warpEntry!.name}`));
                                 warpItemForm.addComponent(new FormDropdown("§7§oList Position:", indexArray, warpIndex));
                                 warpItemForm.addComponent(new FormStepSlider("§7§oAction",["§r§a§lWARP", "§r§9§lEDIT", "§r§c§lDELETE"], 0));
                                 warpItemForm.sendTo(playerNetID, (data, playerNetID) => {
                                     if (data.response !== undefined && data.response !== null){
                                         console.log(data.response);
                                         if (data.response[2] == 0) {    /* WARP */
                                            warpTo(playerActor, warpEntry!.name)
                                         }
                                         if (data.response[2] == 1) {    /* EDIT */
                                             warpEdit(playerActor, warpEntry!.name, data.response[0], data.response[1]);
                                         }
                                         if (data.response[2] == 2) {    /* DELETE */
                                             warpEdit(playerActor, warpEntry!.name, undefined, undefined, true)
                                         }
                                     }
                                 });
                             }
                         }
                     });
                 }
             } else {
                 warpMsg(playerActor, '§c0 §gWarp points set');
             }
         }
         return 0
     }
 },{});

 // /warpset <warpName>
 command.register('warpset', '§eSet§7 a Warp Point.', perms.warpSet).overload((param, origin, _output) => {
     if (origin.getName() != undefined && origin.getName() != '!Â§r') {
         let playerNetID: NetworkIdentifier = connectionList.nXNet.get(origin.getName());
         let playerActor: Player = playerNetID.getActor() as Player;
         if (playerActor != null) {
             let cmdPos: Vec3 = playerActor.getPosition()
             let dimId = playerActor.getDimensionId()
             warpAdd(playerActor, param.warpName, cmdPos, dimId)
         }
         return 0
     }
     return 0

 },{warpName: CxxString});

 // /sethome
 command.register('sethome', `§eSet§7 your ${homename}§r§o§7 Warp Point.`, perms.setHome).overload((_param, origin, _output)=>{
     if (origin.getName() != undefined && origin.getName() != '!Â§r') {
         let playerNetID: NetworkIdentifier = connectionList.nXNet.get(origin.getName());
         let playerActor: Player = playerNetID.getActor() as Player;
         if (playerActor != null) {
             let cmdPos: Vec3 = playerActor.getPosition()
             let dimId = playerActor.getDimensionId()
             warpAdd(playerActor, homename, cmdPos, dimId)
         }
         return 0
     }
     return 0

 },{});

 // /warpto <warpName>
 command.register('warpto', '§aWarp§7 to a Warp Point.', perms.warpTo).overload((param, origin, _output) => {
     if (origin.getName() != undefined && origin.getName() != '!Â§r') {
         let playerNetID: NetworkIdentifier = connectionList.nXNet.get(origin.getName());
         let playerActor: Player = playerNetID.getActor() as Player;
         if (playerActor != null && param.warpName != undefined) {
             warpTo(playerActor, param.warpName);
         }
         return 0
     }
     return 0

 },{warpName: CxxString});

 // /home
 command.register('home', `§aWarp§7 to your ${homename}§r§o§7 Warp Point.`, perms.home).overload((_param, origin, _output)=>{
     if (origin.getName() != undefined && origin.getName() != '!Â§r') {
         let playerNetID: NetworkIdentifier = connectionList.nXNet.get(origin.getName());
         let playerActor: Player = playerNetID.getActor() as Player;
         if (playerActor != null) {
             warpTo(playerActor, homename);
         }
         return 0
     }
     return 0

 },{});

 // /warpdel <warpName>
 command.register('warpdel', '§cDelete§7 a Warp Point.', perms.warpDel).overload((param, origin, output) => {
     if (origin.getName() != undefined && origin.getName() != '!Â§r') {
         let playerNetID: NetworkIdentifier = connectionList.nXNet.get(origin.getName());
         let playerActor: Player = playerNetID.getActor() as Player;
         if (playerActor != null) {
             warpEdit(playerActor, param.warpName, undefined, undefined, true);
         }
         return 0
     }
     return 0
 },{warpName: CxxString});

 // /warpedit <warpName> [newWarpName] [newListPos]
 command.register('warpedit', '§9Edit§7 a Warp Point.', perms.warpEdit).overload((param, origin, output) => {
     if (origin.getName() != undefined && origin.getName() != '!Â§r') {
         let playerNetID: NetworkIdentifier = connectionList.nXNet.get(origin.getName());
         let playerActor: Player = playerNetID.getActor() as Player;
         if (playerActor != null) {
             warpEdit(playerActor, param.warpName, param.newWarpName, param.newListPos);
         }
         return 0
     }
     return 0
 },{warpName: CxxString, newWarpName: [CxxString, true], newListPos: [int32_t, true]})

 // /warpadd <playerName> <warpName> <x> <y> <z> <dimensionId>
 command.register('warpadd', '§6Add§7 a Warp Point for any player at any position.', perms.warpAdd).overload((param, origin, _output) => {
     let cmdPos = origin.getWorldPosition();
     let pos = new Vec3(true)
     let dimId: DimensionId = origin.getDimension().getDimensionId();
     if (param.x.is_relative == true) {
        pos.x = cmdPos.x + param.x.value;
     } else {pos.x = param.x.value}
     if (param.y.is_relative == true) {
         pos.y = cmdPos.y + param.y.value;
     } else {pos.y = param.y.value}
     if (param.z.is_relative == true) {
         pos.z = cmdPos.z + param.z.value;
     } else {pos.z = param.z.value}
     if (param.DimensionId !== undefined) {
         dimId = param.DimensionId
     }
     for (const actor of param.playerName.newResults(origin)) {
         if (actor.isPlayer() == true){
             let playerActor: Player = actor as Player
             warpAdd(playerActor, param.warpName, pos, dimId)
         }
     }},{playerName: ActorWildcardCommandSelector, warpName: CxxString, x: RelativeFloat, y: RelativeFloat, z: RelativeFloat, DimensionId: [int32_t, true]})
