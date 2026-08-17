const FeedReceivers = require('./lib/receivers/feed-receivers');
const HTTP = require('node-rest-client').Client;

module.exports = function (RED) {
    function NnpMonitorNode(config) {
        // var runtime = require("@node-red/runtime");
        RED.nodes.createNode(this, config);
        var node = this;
        this.scope = config.scope;
        var scope = config.scope;
        var selectedNodes = RED.util.cloneMessage(config.nodes);
        const http = new HTTP();
        var flowId = node._flow.flow.id;
        // console.log(flowId, selectedNodes);
        var flowLabel = node._flow.flow.label;
        var flowCtx = node._flow.context;
        var receiver;
        var receiverName = config.receiver;
        // console.log(node.id);
        // console.log(selectedNodes);

        function createReceivers() {
            try {
                if (receiverName != '' && !RED.settings.nnpConfig.config['nnp-monitor'][receiverName]) {
                    RED.log.warn(`[NNP-MONITOR] :::: NO CONFIG FOUND FOR \'${receiverName}\'`);
                }
                receiver = new FeedReceivers[receiverName](RED.settings.nnpConfig.config['nnp-monitor'][receiverName], RED);
            } catch (err) {
                RED.log.error(err);
                RED.log.warn(`[NNP-MONITOR] :::: No Feed Receiver found with the name \'${receiverName}\', falling back to NONE`);
                receiverName = 'NONE';
                receiver = new FeedReceivers[receiverName]();
            }

        }



        function logThis(feed) {
            var extraLogParams = flowCtx.get("nnp-monitor");

            var node = feed.in || feed.out
            var totalLogParams = [flowId + ":" + flowLabel, feed.id + ":" + feed.name, feed['tx-id']].concat(extraLogParams);
            var logMsg = `[${totalLogParams}] :::: '${feed.name}' of '${flowLabel}' is ${feed.status} at '${node.time}'`;
            if (feed.status == "ERROR") {
                RED.log.error(logMsg);
                RED.log.error(`[${totalLogParams}] :::: ${node.error}`);
            } else {
                RED.log.info(logMsg);
            }

        }

        function sendFeed(type, ev, _receiver, _receiverName, _selectedNodes) {
            return new Promise((resolve, reject) => {

                // console.log(scope);

                var feed = {};
                var evNode;
                var extraLogParams = flowCtx.get("nnp-monitor");

                if (extraLogParams) {
                    feed['tx-info'] = extraLogParams;
                }

                var status;
                if (type == 'OUT') {
                    evNode = ev.node?.node;
                    status = "DONE";
                    feed.out = {
                        time: new Date(),
                        payload: ev.msg.payload || {},
                    };
                    if (ev.error) {
                        status = "ERROR";
                        feed.out.error = ev.error
                    }
                } else {
                    evNode = ev.destination?.node;
                    status = "IN_PROGRESS";
                    feed.in = {
                        time: new Date(),
                        payload: ev.msg.payload || {},
                    };
                    if (ev.error) {
                        status = "ERROR";
                        feed.in.error = ev.error
                    }
                }
                feed.id = evNode?.id;
                feed['tx-id'] = `NNP-${ev.msg._msgid}`;
                // console.log(flowId, selectedNodes);
                var nodeDef = _selectedNodes[feed.id];
                
                if (nodeDef) {
                    feed.name = nodeDef.label;
                    feed.status = status;
                    feed.flow = {
                        "id": evNode?.z,
                        "name": flowLabel
                    }
                    logThis(feed);
                    // console.log('.........feed : ', JSON.stringify(feed));
                    //now send the feed TBD
                    if (_receiverName != 'NONE') {
                        _receiver.send(feed);
                    } else {
                        RED.log.warn(`[NNP-MONITOR] :::: No Feed Receiver configured, skipping sending FEED`);
                    }

                }

                resolve();
            });

        }


        function attachListeners() {


            // RED.events.on("nodes:remove", function(node) {
            //     console.log("A node has been added to the workspace!")
            // })


            receiver.connect().then((r) => {
                let nodeEventId = receiverName + "__" + node.id + "__" + flowId;
                let _receiver = receiver;
                let _receiverName = receiverName;
                let _selectedNodes = RED.util.cloneMessage(selectedNodes);
                let _id = node.id;
                console.log(nodeEventId);
                // console.log(_receiverName);
                // console.log(_selectedNodes);

                if (r == true) {
                    RED.hooks.remove("onComplete." + nodeEventId);

                    RED.hooks.add("onComplete." + nodeEventId, (ev) => {
                       
                        // console.log(_id);
                        // console.log(_receiverName);
                        // console.log(_selectedNodes);
                        sendFeed("OUT", RED.util.cloneMessage(ev), _receiver, _receiverName, _selectedNodes);
                        // console.log("onComplete", ev.node?.node?.type || ev.destination?.node?.type || ev)
                        return true;
                    });
                    // console.log(nodeEventId);

                    RED.hooks.remove("onReceive." + nodeEventId);
                    RED.hooks.add("onReceive." + nodeEventId, (ev) => {
                        // console.log(_id);
                        // console.log(_receiverName);
                        // console.log(_selectedNodes);
                        sendFeed("IN", RED.util.cloneMessage(ev), _receiver, _receiverName, _selectedNodes);
                        // console.log("onReceive", ev.node?.node?.type || ev.destination?.node?.type || ev)
                        return true;
                    });
                } else {
                    RED.log.error(r);
                }

            })
        }

        if (RED.settings.nnpConfig.config['nnp-monitor']) {
            createReceivers();
            attachListeners();
        } else {
            http.get(RED.settings.nnpConfig.url, function (data, response) {
                RED.settings.nnpConfig.config = { ...RED.settings.nnpConfig.config, ...data };
                createReceivers();
                attachListeners();
            });
        };

    }




    RED.nodes.registerType("nnp-monitor", NnpMonitorNode);
}
