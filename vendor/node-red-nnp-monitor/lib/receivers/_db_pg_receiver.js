var PGClient = require('pg').Client


class DBPostgresReceiver {

    _CONFIG = {};
    pg;
    red;

    constructor(config, RED) {
        // this._CONFIG = {
        //     host: 'localhost',
        //     port: 5432,
        //     database: 'nnp-monitor',
        //     user: 'postgres',
        //     password: 'postgres',
        // };
        this._CONFIG = config;
        this.red = RED;
    }



    connect = async (params) => {
        try{
            this.pg = new PGClient(this._CONFIG);
            this.red.log.info(`Connecting DB ... ${this._CONFIG.host}:${this._CONFIG.port}`)
            await this.pg.connect();
            this.red.log.info(`... DB connected!!!`)
            return true;
        }catch(err){
            return err;
        }
       
    };
    send = async (payload) => {
        const query = {
            name: 'feed-sql',
            text: '',
            values: [],
            rowMode: 'array',
        }
        if(payload.in){
            query.name = 'SQL_IN_ADD';
            query.text = SQL_IN_ADD;
            query.values = [payload['tx-id'], payload.flow.name, payload.name, payload.status, payload.in?.time, payload.in?.payload, payload.in?.error,  payload.flow.id, payload.id, payload['tx-info']];
            this.pg.query(query).then((result)=>{},
            e=>{
                query.name = 'SQL_IN_UPDATE';
                query.text = SQL_IN_UPDATE;
                query.values =  [payload['tx-id'], payload.id,payload.status, payload.in.time, payload.in.payload, payload.in.error,  payload['tx-info']];
                this.pg.query(query);
            });
        }else{
            query.name = 'SQL_OUT_UPDATE',
            query.text = SQL_OUT_UPDATE;
            query.values = [payload['tx-id'], payload.id,payload.status, payload.out.time, payload.out.payload, payload.out.error,  payload['tx-info']];
            this.pg.query(query).then((result)=>{},
            e=>{
                query.name = 'SQL_OUT_INSERT';
                query.text = SQL_OUT_INSERT;
                query.values = [payload['tx-id'], payload.flow.name, payload.name, payload.status, payload.out?.time, payload.out?.payload, payload.out?.error,  payload.flow.id, payload.id, payload['tx-info']];
                this.pg.query(query)
            });
        }
        return;
    };
    disconnect = async (params) => {
        this.pg.end();
        return;
    };;
}

const SQL_IN_ADD = " INSERT INTO nnp_tx_monitor (id, wf_name, step_name, step_status, in_time, in_payload, error, wf_id, step_id, tx_info, created_on, modified_on)  VALUES($1, $2, $3, $4, $5, $6, $7, $8,  $9, $10, now(), now());";
const SQL_OUT_ADD = " INSERT INTO nnp_tx_monitor (id, wf_name, step_name, step_status, out_time, out_payload, error, wf_id, step_id, tx_info, created_on, modified_on) VALUES($1, $2, $3, $4, $5, $6, $7, $8,  $9, $10, now(), now());";
const SQL_OUT_UPDATE = " UPDATE nnp_tx_monitor SET  step_status=$3, out_time=$4, out_payload=$5, error=$6, tx_info=$7, modified_on=now() where id=$1 and step_id=$2;";
const SQL_IN_UPDATE = " UPDATE nnp_tx_monitor SET  step_status=$3, in_time=$4, in_payload=$5, error=$6, tx_info=$7, modified_on=now() where id=$1 and step_id=$2;"


module.exports = DBPostgresReceiver;


// CREATE TABLE public.nnp_tx_monitor (
// 	id varchar NOT NULL,
// 	wf_name varchar NOT NULL,
// 	step_name varchar NOT NULL,
// 	step_status varchar NOT NULL,
// 	in_time timestamptz NULL,
// 	in_payload text NULL,
// 	out_time timestamptz NULL,
// 	out_payload text NULL,
//     error text NULL,
// 	wf_id varchar NULL,
// 	step_id varchar NULL,
// 	tx_info text NULL,
// 	created_on timestamptz NOT NULL,
// 	modified_on timestamptz NOT NULL
// );
//ALTER TABLE public.nnp_tx_monitor ADD CONSTRAINT nnp_tx_monitor_pk PRIMARY KEY (id,step_id);
