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

import { command } from "bdsx/command";
import { Actor } from "bdsx/bds/actor";
import { RelativeFloat, Vec3 } from "bdsx/bds/blockpos";
import { ActorWildcardCommandSelector } from "bdsx/bds/command";
import { int32_t, void_t } from "bdsx/nativetype";


// Get "tdtp" command permission
const perms = require(`${__dirname}/perms.json`);


// Teleport function
/**
 * @description Trans-dimension teleportation with relative coordinates
 * @example tdTeleport(playerActor, { value: 10 }, { value: -10, is_relative: true }, new RelPos(10, false), 1 )
 */
export function tdTeleport(actor: Actor, x: RelPos, y: RelPos, z: RelPos, dimensionId?: number): void {
    let pos = new Vec3(true);
    if (x.is_relative == true) {
        pos.x = actor.getPosition().x + x.value
    } else {pos.x = x.value}
    if (y.is_relative == true) {
        pos.y = actor.getPosition().y + y.value - 1.62
    } else {pos.y = y.value}
    if (z.is_relative == true) {
        pos.z = actor.getPosition().z + z.value
    } else {pos.z = z.value}
    let dimId: number
    if (dimensionId != undefined && dimensionId <= 2 && dimensionId >= 0) {
        dimId = parseInt(dimensionId.toFixed(0))
    } else { dimId = actor.getDimensionId()}
    // console.log(`Teleporting *${actor.getName()}* TO *${DimensionId[dimId]} @ ${pos.x} ${pos.y} ${pos.z}`)
    actor.teleport(pos, dimId);
}

/**
 * @description Reltive position
 * @example let x = new RelPos(0)
 *          let y = new RelPos(20, true)
 *          let z = new RelPos(100)
 */
 export class RelPos {
    value: number
    is_relative?: boolean
    constructor(value: number, is_relative?: boolean){
        this.value = value
        if (is_relative != undefined) {
            this.is_relative = is_relative
        }
    }
}
// Register Command: '/tdtp <target> <x> <y> <z> <dimensionID>
    command.register('tdtp', 'Trans-dimension teleportation', perms.tdtp).overload((param, origin, output) => {
        // console.log(origin);
        for (const actor of param.target.newResults(origin)) {
            tdTeleport(actor, param.x, param.y, param.z, param.dimensionID);
        }
    }, {target: ActorWildcardCommandSelector, x: RelativeFloat, y: RelativeFloat, z: RelativeFloat, dimensionID: int32_t});


