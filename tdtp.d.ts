import { Actor } from "bdsx";
/**
 * @description Trans-dimension teleportation with relative coordinates
 * @example tdTeleport(playerActor, { value: 10 }, { value: -10, is_relative: true }, new RelPos(10, false), 1 )
 */
export declare function tdTeleport(actor: Actor, x: RelPos, y: RelPos, z: RelPos, dimensionId?: number): void;
/**
 * @description Reltive position
 * @example let x = new RelPos(0)
 *          let y = new RelPos(20, true)
 *          let z = new RelPos(100)
 */
export declare class RelPos {
    value: number;
    is_relative?: boolean;
    constructor(value: number, is_relative?: boolean);
}
