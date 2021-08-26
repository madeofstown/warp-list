
## @bdsx/warp-list
A warp point system for BDSX!
Also includes trans-dimension teleport function and Playerlist Map API.

### ! - New changes for v1.3.0+ - ! 
* More UI elements
* Commands have changed and increased
* Command permissions implemented



## Commands

### From warplist.js
* `/warplist` - shows your warp points with a clickable form-based list
  * For non-clickable text-based list change variable in perms.json
* `/warpset <"warp name">` - set a warp point (use "" for names with spaces)
* `/warpadd <playerName> <"warp name"> <x> <y> <z> <dimensionId>` - Add a warp point for any player at any position
* `/warpdel <"warp name">` - delete a warp point
* `/warpedit <"warp name"> ["new warp name"] [newListPos]` - Edit a warp point's name or position in list (position starts at 1)
* `/warpto <"warp name">` - teleport to a warp point in your list
* `/sethome` - set a warp point called '§5HOME'
* `/home` - teleport to '§5HOME'

### From tdtp.js
* `/tdtp target x y z dimID` - trans-dimension teleport. 
* `dimID`
  * 0 = Overworld
  * 1 = Nether
  * 2 = The End



## Command Permissions
The command permissions can be changed in `node_modules/@bdsx/warp-list/perms.json`. The defaults are:
```json
{
    "homename": "§5HOME",
    "formGUI": true,
    "warpList": 0,
    "warpSet": 1,
    "setHome": 0,
    "warpTo": 0,
    "home": 0,
    "warpEdit": 1,
    "tdtp": 1,
    "warpAdd": 1
}
```
* Set `"formGUI"` to false for text only mode
* Command Permission Values:
  * 0 - Normal (anybody)
  * 1 - Operator
  * 2 - Host
  * 3 - Automation (?)
  * 4 - Admin



## Trans-dimension teleport function
```ts
function tdTeleport(actor: Actor, x: RelPos, y: RelPos, z: RelPos, dimensionId?: number)
```


## Playerlist Map API
### A javascript map object that contains:
* Name <--> NetworkID
* Name <--> XUID
* Name --> Entity

### Example: Have NetworkID and want Entity

```ts
import {connectionList} from "@bdsx/warp-list/playerlist"

let name = connectionList.nXNet.get(NetworkID)
let entity = connectionList.n2Ent.get(name)
```
