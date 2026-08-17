var HTTP = require('node-rest-client').Client;


class RESTReceiver {

    _CONFIG = {};
    http;
    red;

    constructor(config, RED) {
       // this._CONFIG.url = 'http://localhost:1102/mock/feed';
       this._CONFIG = config
       this.red = RED;
    }



    connect = async (params) => {
        this.http = new HTTP();
        return true;
    };
    send = async (payload) => {
        // set content-type header and data as json in args parameter
        var args = {
            data: payload,
            headers: { "Content-Type": "application/json" }
        };

        return await this.http.post(this._CONFIG.url, args, function (data, response) {
            return data;
        });

    };
    disconnect = async (params) => {
        //do nothig 
        return;
    };;
}



module.exports = RESTReceiver;