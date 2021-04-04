
## @bdsx/warp-list
A warp point system for BDSX!
Also includes trans-dimension teleport function and Playerlist Map API.

## Commands
* `/warp list` - shows your warp points with a clickable form-based list
  * For non-clickable text-based list change variable in warplist.js
* `/warp set "warp name"` - set a warp point (use "" for names with spaces)
* `/warp del "warp name"` - delete a warp point
* `/warp to "warp name"` - teleport to a warp point in your list
* `/sethome` - set a warp point called '§5HOME'
* `/home` - teleport to '§5HOME'

## Disabled Command (change variable in tdtp.js to enable)
* `/tdtp target x y z dimID` - trans-dimension teleport. 
* `dimID`
  * 0 = Overworld
  * 1 = Nether
  * 2 = The End

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
