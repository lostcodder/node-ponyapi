# Node PonyApi - Simple Node.js VK API Realisation
## Installation
test
```
npm install https://github.com/lostcodder/node-ponyapi
```

## Usage

```js
var PonyApi = require('node-ponyapi')
var bot = new PonyApi('Your Access Token')

// Method that returns current user ID, first name and last name
bot.api.users.get({}, (res) => {
    console.log(res);
})

// Emits a "message" event when some message received.
bot.longPoll.on('message', (msg) => {
        console.log(msg);
})
```
