var AMQPClient = require('amqp10').Client
var Policy = require('amqp10').Policy

Promise = require('bluebird');

var client = new AMQPClient(); // Uses PolicyBase default policy
client.connect('amqp://localhost:5672',  {'saslMechanism':'ANONYMOUS'})
    .then(function () {
        console.log("CONNECTED... ");
        return Promise.all([
            client.createReceiver('nnp-monitor'),
            client.createSender('nnp')
        ]);
    })
    .spread(function (receiver, sender) {
        // console.log("spreading ");
        receiver.on('errorReceived', function (err) { // check for errors 
        });
        receiver.on('message', function (message) {
            console.log('\n\n----------------------- START OF FEED -----------------------');
            console.log(message.body);
            console.log('------------------------ END OF FEED ------------------------');
        });
        console.log("LISTENING... ");
        return ;
    })
    .error(function (err) {
        console.log("error: ", err);
    });


// var client = require('rhea');
// client.sasl_server_mechanisms.enable_anonymous();

// client.on('message', function (context) {
//     console.log(context.message.body);
//     context.connection.close();
// });
// client.once('sendable', function (context) {
//     context.sender.send({body:'Hello World!'});
// });
// var connection = client.connect({'port':5672});
// connection.open_receiver('nnp');
// connection.open_sender('nnp');



