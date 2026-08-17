

const AMQPClient = require('amqp10').Client


class AMQPReceiver {


    _client = new AMQPClient();
    _sender;
    red;

    _CONFIG = {};

    constructor(config, RED) {
        // this._CONFIG.host = 'localhost';
        // this._CONFIG.port = '5672';
        // this._CONFIG.queue = 'nnp-monitor';
        this._CONFIG = config;
        this.red = RED;
    }

    connect = async (params) => {
        try{
            this.red.log.info(`Connecting MQ ... amqp://${this._CONFIG.user}:***********@${this._CONFIG.host}:${this._CONFIG.port}`)
            await this._client.connect(`amqp://${this._CONFIG.user}:${this._CONFIG.password}@${this._CONFIG.host}:${this._CONFIG.port}`, {
                'idleTimeout': 1000,
            }).error(function(err) {
                this.red.log.error(err);
              });
            this._sender = await this._client.createSender(this._CONFIG.queue);
            this.red.log.info(`... MQ connected!!!`)
            return true;
        }catch(err){
            this.red.log.error(err);
            return err;
        }
        
    };
    send = async (payload) => {
        // console.log("payload ======= " , payload)
        if (!this._sender) {
            this._sender = await this._client.createSender(this._CONFIG.queue);
        }

        var response = this._sender.send(payload);
        return response;
    };
    disconnect = async (params) => {
        return this._client.disconnect();
    };
}



module.exports = AMQPReceiver;