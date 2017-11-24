var request = require('request');
var fs = require("fs");
const path = require('path');

class Upload {
    constructor(api) {
        this.api = api
    }

    chatPhoto(chat_id, file, callback) {
        this.api.photos.getChatUploadServer({chat_id: chat_id}, (res) => {
            var uploadUrl = res.upload_url

            this.uploadFile(uploadUrl, 'file', file, (resp) => {
                this.api.messages.setChatPhoto({file: resp.response}, (r) => {
                    if (callback) callback(r)
                })
            })
        })
    }

    ownerCoverPhoto(group_id, file, callback) {
        this.api.photos.getOwnerCoverPhotoUploadServer({group_id: group_id}, (res) => {
            var uploadUrl = res.upload_url

            this.uploadFile(uploadUrl, 'photo', file, (resp) => {
                this.api.photos.saveOwnerCoverPhoto({hash: resp.hash, photo: resp.photo}, (r) => {
                    if (callback) callback(r)
                })
            })
        })
    }

    messagesPhoto2(peer_id, data, callback) {
        this.api.photos.getMessagesUploadServer({peer_id: peer_id}, (res) => {
            var uploadUrl = res.upload_url
            var formData = {
                photo: {
                    value: data,
                    options: {
                        filename: 'photo.jpg'
                    }
                }
            }
            
            this.uploadFile(uploadUrl, formData, data, (resp) => {
                this.api.photos.saveMessagesPhoto({photo: resp.photo, server: resp.server, hash: resp.hash}, (r) => {
                    if (callback) callback(r)
                })
            })
        })
    }

    messagesPhoto(peer_id, files, callback) {
        this.api.photos.getMessagesUploadServer({peer_id: peer_id}, (res) => {
            var uploadUrl = res.upload_url
            this.uploadMessagesPhotos(peer_id, files, uploadUrl, (r)=>{
                callback(r)
            })
        })
    }

    uploadMessagesPhoto(peer_id, files, uploadUrl, callback) {
        this.uploadFile(uploadUrl, 'photo', files, (resp) => {
            this.api.photos.saveMessagesPhoto({photo: resp.photo, server: resp.server, hash: resp.hash}, (r) => {
                if (callback) callback(r)
            })
        })
    }

    uploadFile(uploadUrl, name, file, callback) {
        var req = request.post({ url: uploadUrl}, function (error, response, body) {
            var res = JSON.parse(body)
            callback(res)
        })

        var form = req.form();

        form.append(name, file.data, {
            filename: file.name
        });            
    }

    uploadMessagesPhotos(peer_id, files, uploadUrl, callback, r = []) {
        if (files.length > 0) {
            var file = files.shift()
            this.uploadMessagesPhoto(peer_id, file, uploadUrl, (res) => {
                r.push(res[0])
                this.uploadMessagesPhotos(peer_id, files, uploadUrl, callback, r)
            })
        } else callback(r)
    }

    getFiles(f) {
        var r = []
        f.forEach((item)=>{
            var name = path.basename(item)
            var data = fs.readFileSync(item);
            r.push({name: name, data: data})
        })

        return r
    }
}

module.exports = Upload
