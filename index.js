var request = require('request');
var LongPoll = require('./longPoll.js')
var Upload = require('./upload.js')
var Antigate = require('antigate');
var ag = new Antigate('bc557b2f0e211930e17c8736dd5751fa');

function PonyApi (token = false, p = {}) {
    this.access_token = token
    var defaults = {
        retry_interval: 5,
        start: true
    }

    if (p.headers) this.headers = p.headers

    for (i in defaults) {
        if (!p.hasOwnProperty(i)) p[i] = defaults[i]
    }

    this.params = p
    var getCaptcha = function (url, callback) {
        ag.processFromURL(url, function(error, text, id) {
          if (error) {
          } else {
            callback (text)
          }
        });
    }

    var doPost = (m, p, callback) => {
        var url = 'https://api.vk.com/method/'+ m;
        if (!p.access_token) p.access_token = this.access_token
        p.v = '5.68';
        var options = {url: url, form: p}

        if (this.headers) options.headers = this.headers
        request.post(options, (error, response, body) => {
            if (error) console.log(error)
            try {
                if (callback) {
	                var res = JSON.parse(body)

		            if (res.error) {
		                if (res.error.error_code == 14) {
		                    getCaptcha(res.error.captcha_img, (key) =>  {
		                        p.captcha_sid = res.error.captcha_sid
		                        p.captcha_key = key
		                        doPost(m, p, callback)
		                    })
		                } else {
		                    callback(null, res.error)
		                }
		                
		            } else {
		                if (res.response) callback(res.response, null)
		                else callback(res.response, null)
		            }
		    	}
            } catch(e) {

                setTimeout(() => { 
                    doPost(m, p, callback)
                }, this.params.retry_interval * 1000)  
            }


        });
    }

    this.doPost = (m, p, callback) => {
        doPost(m, p, (res, err)=>{
            callback(res, err)
        })
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