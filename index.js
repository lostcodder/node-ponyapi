var request = require('request');
var LongPoll = require('./longPoll.js')

function PonyApi (token) {
    this.access_token = token
    this.params = {
        retry_interval: 5
    }

    var doPost = (m, p, callback) => {
        var url = 'https://api.vk.com/method/'+ m;

        p.access_token = this.access_token
        p.v = '5.60';

        request.post({url: url, form: p}, (error, response, body) => {
            try {
                var res = JSON.parse(body)
                if (res.error) {
                    callback(null, res.error)
                } else {
                    callback(res.response, null)
                }
            } catch(e) {
                console.log('error, retraeng');
                setTimeout(() => { 
                    doPost(m, p, callback)
                }, this.params.retry_interval * 1000)  
            }
        });
    }

    var mod
    var met

    var f = new Proxy({},{get(target,name) {
          return function() {
            met = name
            var p = arguments[0]
            var cb = arguments[1]
            var m = mod + '.' + met

            doPost(m, p, (res, err)=>{
                cb(res, err)
            })
          }
    }});

    var o = new Proxy({}, {
      get(target, prop) {
        mod = prop

        return f
      }
    });

    this.api = o

    
    this.longPoll = new LongPoll(this.api)
    this.longPoll.start()
}

module.exports = PonyApi