var request = require('request');
var LongPoll = require('./longPoll.js')
var Upload = require('./upload.js')

function PonyApi (token = false, p = {}) {
    this.access_token = token
    var defaults = {
        retry_interval: 5,
        start: true
    }

    for (i in defaults) {
        if (!p.hasOwnProperty(i)) p[i] = defaults[i]
    }

    this.params = p

    var doPost = (m, p, callback) => {
        var url = 'https://api.vk.com/method/'+ m;

        if (this.access_token) p.access_token = this.access_token
        p.v = '5.68';

        request.post({url: url, form: p}, (error, response, body) => {
            try {
                if (callback) {
                    var res = JSON.parse(body)
                }
            } catch(e) {
                console.log(e);
                console.log('error, retraeng');
                setTimeout(() => { 
                    doPost(m, p, callback)
                }, this.params.retry_interval * 1000)  
            }
                    if (res.error) {
                        console.log(error);
                        callback(null, res.error)
                    } else {
                        callback(res.response, null)
                    }
        });
    }

    var mod
    var met

    var f = new Proxy({},{get(target,name) {
          return function() {
            met = name
            if (arguments[1]) {
                var p = arguments[0]
                var cb = arguments[1]
            } else {
                if (typeof arguments[0] == 'function') {
                    var p = {}
                    var cb = arguments[0]
                } else {
                    var p = arguments[0]
                    var cb = false
                }
            }

            var m = mod + '.' + met

            doPost(m, p, (res, err)=>{
                if (cb) cb(res, err)
            })
          }
    }});

    var api = new Proxy({}, {
      get(target, prop) {
        mod = prop

        return f
      }
    });
    
    var longPoll = new LongPoll(api)

    this.upload = new Upload(api)

    this.toPeer = (chat_id) => {
        return 2000000000 + chat_id
    }

    this.on = (e, callback) =>{
        longPoll.on(e, callback)
    }

    this.start = () => {
        longPoll.start()
    }

    this.__proto__ = Object.create(api)
    if (this.params.start) longPoll.start()
}

module.exports = PonyApi