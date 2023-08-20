module.exports = {
    'apiServerIp': '10.16.6.13:8080',
    'delayInDays': '10.16.6.13:8080',
	'database00': 'mongodb://localhost:27017/host_hub',
    'chars': {
        SOH: String.fromCharCode(1),
        STX: String.fromCharCode(2),
        ETX: String.fromCharCode(3),
        EOT: String.fromCharCode(4),
        ENQ: String.fromCharCode(5),
        ACK: String.fromCharCode(6),
        LF: String.fromCharCode(10),
        CR: String.fromCharCode(13),
        NAK: String.fromCharCode(21),
        ETB: String.fromCharCode(23),
        GS: String.fromCharCode(29),
        RS: String.fromCharCode(30)
    },
    secret: 'PraiseBeToALLAH',
    tokenExpiry: 60*60*24*365,
    mssql: {
        user: 'sghITLab',
        password: 'sghit@2018',
        server: '130.7.1.22',
        database: 'HIS',    
        options: {
            encrypt: true // Use this if you're on Windows Azure
        }
    },
    mssql00: {
        user: 'sgh',
        password: 'Yx0k?FsA0r?O',
        server: 'den1.mssql8.gear.host',
        database: 'SGH',    
        options: {
            encrypt: true // Use this if you're on Windows Azure
        }
    }
};