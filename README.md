# Node PonyApi - Simple Node.js VK API Realization
## Installation

```
npm install https://github.com/lostcodder/node-ponyapi
```

## Usage

```js
var PonyApi = require('node-ponyapi')
var bot = new PonyApi('Your Access Token')

// Method that returns current user ID, first name and last name
bot.api.users.get((res) => {
    console.log(res);
})

// Emits a "message" event when some message received.
bot.longPoll.on('message', (msg) => {
        console.log(msg);
})
```


## Table of contents

- [API methods](#api-methods)
- [LongPool events](#longpool-events)


---


## API methods

You can look for all available methods here - https://vk.com/dev/methods



## LongPool events

### 'message'

Message received.

```js
bot.longPoll.on('message', (msg) => {
        console.log(`Received message with text: '${msg.text}'`);
})
```



### 'chat_invite_user'

User entered chat.

```js
bot.longPoll.on('chat_invite_user', (msg) => {
        console.log(`User ${msg.attachments.source_mid} added to chat room`);
})
```



### 'chat_kick_user'

User leave chat.

```js
bot.longPoll.on('chat_kick_user', (msg) => {
        console.log(`User ${msg.attachments.source_mid} leave a chat`);
})
```



### 'chat_title_update'

Chat name changed

```js
bot.longPoll.on('chat_title_update', (msg) => {
        console.log(`Chat name is changed from "${msg.attachments.source_old_text}" to "${msg.attachments.source_text}"`);
})
```


### 'chat_photo_update'

Chat photo changed

```js
bot.longPoll.on('chat_photo_update', (msg) => {
        console.log('Chat photo is changed');
})
```


### 'chat_create'

Chat created

```js
bot.longPoll.on('chat_create', (msg) => {
        console.log('Chat is changed');
})
```

