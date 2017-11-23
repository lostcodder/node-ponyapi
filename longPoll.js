const EventEmitter = require('events');
var request = require('request');

class LongPoll extends EventEmitter {
  constructor(api) {
    super()
    this.api = api
    this.started = false
    this.params = {
        retry_interval: 5
    }
  }   
  start () {
        this.api.users.get((u)=>{
            this.user = u[0].id
            this.getUpdates((updates) => {
                if (updates) {
                    updates.forEach((item, i, arr) => {
                        if ((item[0] == 4) && (!(item[2]&2))) {
                            var msg = this.createMessage(item)
                            if (!msg.attachments.source_act) {
                                this.emit('message', msg)
                            } else {
                                this.emit(msg.attachments.source_act, msg)
                            }
                        }
                    })
                }
            })
        })
    }

    createMessage(data) {
        if (data[7].from && data[7].fwd) {
            var fwd = this.splitFwd(data[7].fwd);
        }

        var msg = {
            id: data[1],
            peer_id: data[3],
            timestamp: data[4],
            subject: data[5],
            text: data[6].trim().replace(new RegExp('&quot;','g'),'"').replace(new RegExp('&quot;','g'),'"').replace(new RegExp('<br>','g'),'\n\r'),
            type: (data[7].from) ? 'b' : 'm',
            from: (data[7].from) ? data[7].from : data[3],
            fwd: (fwd) ? fwd : false,
            isChat: () => {
                if (msg.type == 'b') return true
                else return false
            },
            reply: (text, callback) => {
                this.api.messages.send({peer_id: msg.peer_id, forward_messages: msg.id, message: text}, callback)
            },
            send: (text, callback) => {
                this.api.messages.send({peer_id: msg.peer_id, message: text}, callback)
            },     
            sendPvt: (text, callback) => {
                this.api.messages.send({peer_id: msg.from, message: text}, callback)
            },       
        };
        msg.chat_id = this.getChatId(msg.peer_id)

        if (data[7]) {
            msg.attachments = data[7]
        }
        return msg  
    }

    getServer (callback) {
        this.api.messages.getLongPollServer({}, (res, err) => {
            this.server = res;
            callback(res);
        });
    }

    splitFwd (str) {
        var c = str.split(':').length - 1;
        if (c > 0 ){
            var e = (c == 1) ? ')' : ':';
            var res = str.substr(str.indexOf('(')+1);
            res = res.substr(0,res.indexOf(e));
        
            var arr = res.split('_');
            res = {to_id: arr[0], message_id: arr[1]}
            
            if (res.to_id == this.user) {
                return res;
            }
        }

        return false;  
    }

    getUpdates (callback) {
        this.getServer(() => {
            this.pollQuery ((body) => {
                callback(body.updates);
            })
        })
    }

    pollQuery (callback) {
        if (!this.started) {
            this.started = true
            this.emit('start', this.user)
        }
        this.pollRequest((res) => {
            callback(res);
            this.pollQuery(callback);
        });
    };

    pollRequest (callback) {
        var url = `https://${this.server.server}?act=a_check&key=${this.server.key}&ts=${this.server.ts}&wait=25&mode=2&version=1`;
        var o = {url: url}
        if (this.api.headers) o.headers = this.api.headers
        request(o, (error, response, res) => { 
            if (!error) {
                try {
                    res = JSON.parse(res);
                    this.server.ts = res.ts
                }
                catch (e) {
                    setTimeout(() => { 
                        this.getServer(() => {
                            this.pollRequest(callback);
                        }) 
                    }, this.params.retry_interval * 1000)  
                }
                
                if (!res.failed) {

                    callback(res);    
                }
                else if (res.failed == 1){

                    this.pollRequest(callback);
                } else {

                    this.getServer(() => {
                        this.pollRequest(callback);
                    }) 
                }
            }
            else {
                setTimeout(() => { 
                    this.getServer(() => {
                        this.pollRequest(callback);
                    }) 
                }, this.params.retry_interval * 1000)    
            }
        })
    }

    getChatId (peer_id) {
        var res = peer_id - 2000000000;

        return res.toString();
    }
}

module.exports = LongPoll