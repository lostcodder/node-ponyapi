# Node PonyApi - Simple Node.js VK API Realisation
## Installation

```
npm install https://github.com/lostcodder/node-ponyapi
```

## Usage

```js
var PonyApi = require('node-ponyapi')
var bot = new PonyApi('Your api token')

vk.api.users.get({}, (res) => {
    console.log(res);
})

bot.longPoll.on('message', (msg) => {
        console.log(msg);
})
```
