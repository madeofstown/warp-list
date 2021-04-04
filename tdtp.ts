//------------------------------------------------------------------------------//
//                          Transdimenstion Teleport                            //
//                               script for BDSX                                //
//                              (tdtp.ts/tdtp.js)                               //
//                         by randommouse/madeofstown                           //
//------------------------------------------------------------------------------//
//                                Use/Function:                                 //
//                     Teleport Players Across Dimensions                       //
//------------------------------------------------------------------------------//
//                          Required Custom Scripts:                            //
//                         plyerlist.ts/playerlist.js                           //
//                         Recommended Custom Scripts:                          //
//                              index.ts/index.js                               //
//------------------------------------------------------------------------------//
//                   Thansks to P Jai Rjlin and their work @                    //
// https://github.com/Rjlintkh/bdsx-scripts/blob/main/scripts/minecraftFunctions.ts  //
//------------------------------------------------------------------------------//

import { pdb } from "bdsx/core";
import { SYMOPT_UNDNAME } from "bdsx/common";
import { ProcHacker } from "bdsx/prochacker";
import { Actor, command, DimensionId, RawTypeId } from "bdsx";
import { RelativeFloat, Vec3 } from "bdsx/bds/blockpos";
import { connectionList } from "./playerlist";
import { ActorWildcardCommandSelector, CommandPermissionLevel } from "bdsx/bds/command";
import { int32_t } from "bdsx/nativetype";
import { relative } from "node:path";

// Set to 'true' to enable '/tdtp' command
let tdtp: boolean = false

// Open PDB and look for teleport function
pdb.setOptions(SYMOPT_UNDNAME);
const hacker = ProcHacker.load(`${__dirname}/pdbcache.ini`, [
    "TeleportCommand::teleport"
]);
pdb.setOptions(0);
pdb.close();
const _tdtp = hacker.js("TeleportCommand::teleport", RawTypeId.Void, null, Actor, Vec3, Vec3, RawTypeId.Int32);

// Teleport function
export function tdTeleport(actor: Actor, x:{value:number, is_relative?: boolean}, y:{value:number, is_relative?: boolean}, z:{value:number, is_relative?: boolean}, dimensionId?: number): void {
    let pos = new Vec3(true);
    if (x.is_relative == true) {
        pos.x = actor.getPosition().x + x.value
    } else {pos.x = x.value}
    if (y.is_relative == true) {
        pos.y = actor.getPosition().y + y.value
    } else {pos.y = y.value}
    if (z.is_relative == true) {
        pos.z = actor.getPosition().z + z.value
    } else {pos.z = z.value}
    let dimId: number
    if (dimensionId != undefined && dimensionId <= 2 && dimensionId >= 0) {
        dimId = parseInt(dimensionId.toFixed(0))
    } else { dimId = actor.getDimension()}
    console.log(`Teleporting *${actor.getName()}* TO *${DimensionId[dimId]} @ ${pos.x} ${pos.y} ${pos.z}`)
    _tdtp(actor, pos, new Vec3(true), dimId);
}

if (tdtp != false){
    command.register('tdtp', 'Trans-dimension teleportation', 1).overload((param, origin, output) => {
        console.log(origin);
        for (const actor of param.target.newResults(origin)) {
            tdTeleport(actor, param.x, param.y, param.z, param.dimensionID); 
        }
    }, {target: ActorWildcardCommandSelector, x: RelativeFloat, y: RelativeFloat, z: RelativeFloat, dimensionID: int32_t});
}
