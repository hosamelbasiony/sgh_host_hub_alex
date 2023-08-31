// =================================================================
// get the packages we need ========================================
// =================================================================
const path 	      = require('path');
const express 	  = require('express');
const bodyParser  = require('body-parser');
const morgan      = require('morgan');
const cors        = require('cors');
const socketio    = require('socket.io');
const compression = require('compression');
const colors      = require('colors');

const env = process.env.NODE_ENV || 'development';

const connection = require('./db/models')(env);
const sghConnection = require('./sghDb/models')(env);

const archi         = require('./analyzers/archi');
const advia560      = require('./analyzers/advia560');
const ca600         = require('./analyzers/ca600series'); 
const abl800        = require('./analyzers/abl800'); 
const e411          = require('./analyzers/e411');
const sysmex_urine  = require('./analyzers/sysmex_urine');
const dimension     = require('./analyzers/dimension');

// 10.16.6.15
// server user: tarqeem
// server password: asd

////////////////////////////////////////////////////////////
////////////////////////// TODO ////////////////////////////
// Dimension
// Phoenix M50
// Biofire
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

const config      = require('./config');

const port = process.env.PORT || 8003;

const app = express();

app.use(compression({
    filter: (req, res) => req.headers['x-no-compression']? false : compression.filter(req, res),
    level: 9
}));

app.use('/', express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ 
    parameterLimit: 100000,
    limit: '50mb',
    extended: true
}));
app.use(bodyParser.json());

app.use(morgan('dev'));


// =================================================================
// routers =========================================================
// =================================================================

app.use('/api/auth', require('./routes/auth')(connection));
app.use('/api/user', require('./routes/users')(connection));
app.use('/api/sgh', require('./routes/sgh')(sghConnection));
app.use('/api/parameters', require('./routes/parameters')(connection));
app.use('/api/devices', require('./routes/devices')(connection));
app.use('/api/scheduling', require('./routes/scheduling')(connection));


app.get("/test", (req, res) => {
    const { exec } = require('child_process');
    let yourscript = exec('sh test.sh > null',
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });

    res.json({data: "test"})
})

app.get("/ping", (req, res) => {
    const { exec } = require('child_process');
    let yourscript = exec('sh upgrade.sh > null',
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });

    res.json({data: "pong"})
})

app.get("/pong", (req, res) => {
    const { exec } = require('child_process');
    let yourscript = exec('sh upgrade2.sh > null',
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });

    res.json({data: "ping"})
})

app.get('*', (req, res) => res.send("No such route"));

let server;

connection.sync().then( async() => {

    // await sghConnection.sync({force: 0});

    global.connection = connection;
    // global.sgh = sghConnection;

    server = app.listen(port, () => {
        console.log(('Middleware app server 2 started at http://localhost:' + port).blue);
        startIO();
 
        advia560.start(io, connection, sghConnection);
        // archi.start(io, connection, sghConnection);
        // ca600.start(io, connection, sghConnection);  
        // abl800.start(io, connection, sghConnection);
        // e411.start(io, connection, sghConnection);
        sysmex_urine.start(io, connection, sghConnection);
        
        // dimension.start(io, connection, sghConnection);
    });
});

function startIO() {
    io = socketio(server);

    io.on('connection', (socket) => {
        console.log('Connected')
        io.on('disconnect', (socket) => { 
            console.log('Disconnected')
        })
    })

    emitmessage = (flag, msg) => {
        io.emit( flag, msg );
    }
}