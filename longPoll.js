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
        this.api.groups.get((u)=>{
            this.user = 173005038
            this.emit('start')
            this.getUpdates((updates) => {
                if (updates) {
                    updates.forEach((item, i, arr) => {
                        //if ((item[0] == 4) && (!(item[2]&2))) {
                            this.createMessage(item.object, (msg)=>{
                                //if (!msg.attachments.source_act) {
                                    this.emit('message', msg)
                                //} else {
                                //    this.emit(msg.attachments.source_act, msg)
                                //}
                            })
                        //}
                    })
                }
            })
        })
    }

    createMessage(data, callback) {        
/*        if (data[7].from && data[7].fwd) {
            var fwd = this.splitFwd(data[7].fwd);
        }*/

        var msg = {
            id: data.conversation_message_id,
            peer_id: data.peer_id,
            timestamp: data.date,
            subject: null,
            text: data.text.trim().replace(new RegExp('&quot;','g'),'"').replace(new RegExp('&quot;','g'),'"').replace(new RegExp('<br>','g'),'\n\r'),
            type: 'b',
            from: data.from_id.toString(),
            fwd: false,
            notice: false,
            isChat: () => {
                return true
            },
            reply: (text, callback) => {
                if(msg.user){
                    text = `${msg.user.name.split(' ')[0]}, ${text}`
                }
                this.api.messages.send({peer_id: msg.peer_id, message: text, random_id: getRandomInt(10000, 99999)}, ()=>{
                    if (callback) callback()
                })
            },
            send: (text, callback) => {
                this.api.messages.send({peer_id: msg.peer_id, message: text, random_id: getRandomInt(10000, 99999)}, ()=>{
                    if (callback) callback()
                })
            },     
            sendPvt: (text, callback) => {
                this.api.messages.send({peer_id: msg.from, message: text, random_id: getRandomInt(10000, 99999)}, ()=>{
                    if (callback) callback()
                })
            }       
        };
        msg.chat_id = this.getChatId(msg.peer_id)

        msg.getPhotos = () => {
            return false
        }
        callback(msg)
        //console.log(msg)
/*  */
    }

    getServer (callback) {
        this.api.groups.getLongPollServer({group_id: 173005038}, (res, err) => {
            
            this.server = res;
            callback(res);
        });
    }

    getAttachments(msg) {
        var att = msg.attachments
        var res = []
        var i = 1
        for (var n in att){
            if (n == "attach"+i+"_type"){
                var type = att[n]
                var data = att["attach"+i]
                res.push({type: type, data: data})
                i++
            }
        }

        return res
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
        var url = `${this.server.server}?act=a_check&key=${this.server.key}&ts=${this.server.ts}&wait=25`;
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

module.exports = LongPoll
