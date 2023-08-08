module.exports = {
    'serverIp': '0.0.0.0',
    'port': '3001',
    'devices': [32],
    'apiURL': "https://curelab2.tarqeem.net/laboratory/host/",
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
    }
};