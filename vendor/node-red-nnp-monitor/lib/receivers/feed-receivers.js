const AMQPReceiver = require("./_amqp-receiver");
const DBPostgresReceiver = require("./_db_pg_receiver");
const RESTReceiver = require("./_rest-receiver");

class DefaultReceiver {
    connect = async (params) => {
        //do nothig 
        return true;
    };
    send = async (payload) => {
        //do nothing
        return;
    };
    disconnect = async (params) => {
        //do nothig 
        return;
    };;
}


module.exports = {
    'NONE': DefaultReceiver,
    'AMQP': AMQPReceiver,
    'REST': RESTReceiver,
    'DB_PG': DBPostgresReceiver,
};