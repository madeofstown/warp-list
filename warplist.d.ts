import { DimensionId } from 'bdsx';
declare module "bdsx/bds/player" {
    interface Player {
        getPlayerDB(): {
            playerDB: PlayerDBEntry;
            index: number;
        } | undefined;
    }
}
declare class PlayerDBEntry {
    xuid: string;
    name: string;
    warp: WarpDBEntry;
    constructor(xuid: string, name: string, warp?: WarpDBEntry);
    getWarp(name: string): {
        warp: WarpDBEntry;
        index: number;
    } | undefined;
}
declare class WarpDBEntry {
    [key: string]: any;
    constructor(warpName: string, dimensionId: DimensionId, xPos: number, yPos: number, zPos: number);
}
export {};
