var PonyApi = require('./')
var bot = new PonyApi(null, {start: false})

bot.users.get({user_ids: '1'})
