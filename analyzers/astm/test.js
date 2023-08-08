
const astm              = require('./utils');

const SOH  = String.fromCharCode(1);
const STX  = String.fromCharCode(2);
const ETX  = String.fromCharCode(3);
const EOT  = String.fromCharCode(4);
const ENQ  = String.fromCharCode(5);
const ACK  = String.fromCharCode(6);
const LF  = String.fromCharCode(10);
const VT  = String.fromCharCode(11);
const CR  = String.fromCharCode(13);
const EXT  = String.fromCharCode(15);
const NAK  = String.fromCharCode(21);
const ETB  = String.fromCharCode(23);
const FS  = String.fromCharCode(28);
const GS  = String.fromCharCode(29);
const RS  = String.fromCharCode(30);

const dateString = (extended = true) => {
    let d = new Date();
    let ret = d.getFullYear();
    ret += (d.getMonth()+1+'').length == 2 ? d.getMonth()+1+'' : '0' + (d.getMonth()+1)+''
    ret += (d.getDate()+'').length == 2 ? d.getDate()+'' : '0' + d.getDate()+''
    
    if ( extended ) ret += (d.getHours()+'').length == 2 ? d.getHours()+'' : '0' + d.getHours()+''
    if ( extended ) ret += (d.getMinutes()+'').length == 2 ? d.getMinutes()+'' : '0' + d.getMinutes()+''
    if ( extended ) ret += (d.getSeconds()+'').length == 2 ? d.getSeconds()+'' : '0' + d.getSeconds()+''

    return ret;
};

const requestMessage = async lab_id => {

    let SidParams = lab_id.split("^");
    
    ///////////////////////////////////////////////////////////////////////////////////////
    /////// WEIRD FIX /////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    SidParams = ["", ...SidParams];
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////


    lab_id = SidParams[2];
    let POS = SidParams[3] + "^" + SidParams[4] + "^" + SidParams[5] + "^^" + SidParams[7] + "^" + SidParams[8];

    try {
  
        ///////////////////////////////////////////////////////////////////////////////////////
        /////// DB Requisition ////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////
        let LabNumber = lab_id.toString().replace(/^0+/, '');
        LabNumber = LabNumber.replace(/^0+/, '');
        LabNumber = LabNumber.replace(/@/, '');
        
        // const analyzerParamList = await connection.models.deviceCode.findAll({
        //     where: {
        //         download: true,
        //         deviceId: device.id,
        //     }
        // });    

        
        // let inStatement = [0, ...analyzerParamList.map( x => x.paramId+'' )].join(',');

        // console.log(inStatement);

        const analyzerParamList = [];

        // let sql = `SELECT * FROM IPOP_LABORDERS 
        // WHERE LabNumber = ${LabNumber} AND ParameterID IN (${inStatement})`;

        // console.log(sql);
        
        const results = []; //await sgh.query(sql, { type: Sequelize.QueryTypes.SELECT});
                
        let patientName = 'HOSAM MOHAMMAD';
        let patientId = '0000';
        let gender = 'MALE';
        let DOB = '19800122';
            

        let ret = { codes: ["12"], patientId, patientName };
        ///////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////
        let codes = ret.codes;
        //let patientNames = ret.patientName.split(' ');
        let [name1, name2, name3] = ret.patientName.split(' ');
    
    	let LabPID =  ret.patientId;
        
        let PatientDOB =  '19780727';
        let PatientGender =  'M'; //F -- U
        let Referral =  '';
        let Location =  'SGHC01';
        let TestRequest = codes.map(x => '^^^'+x).join('^\\') + '^';
        let CollectionDate = dateString(); //20010223081223

        let PracticePID = ''; 

        msgtosend = [];

        console.log(`O|1|${lab_id}|${POS}|${TestRequest}|R||||||A||||1||||||||||O${CR}`);

        let record = `${STX}1H|\\^&|||cobas-e411^1|||||host|TSDWN^REPLY|P|1${CR}`;
        record    += `P|1${CR}`;
        record    += `O|1|${lab_id}|${POS}|${TestRequest}|R||||||A||||1||||||||||O${CR}`;
        record    += `L|1|N${CR}${ETX}`;

        record = record + astm.checksum(record) + `${CR}${LF}`;
        msgtosend = [...msgtosend, record];

        msgtosend.reverse();
        
        // console.log(msgtosend[0]);

        ///////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////

    } catch(ex) {
        console.log(ex.stack);
    }
};


let line = `Q|1|^^373146^1549^@7^1^^S1^SC||ALL||||||||A`;
// let line = `Q|1|^^000002^3^@95^2^^S1^SC||ALL||||||||O`;
//O|1|000002|3^@95^2^^S1^SC|^^^10^|R||||||A||||1||||||||||O
//O|1|000002|3^@95^2^^S1^SC|^^^12^|R||||||A||||1||||||||||O

let SID_ = false;
let rackNo = '';
let tubePosition = '';
let sampleIdAttr = '';

try {
    SID_ = line.split("|")[2].replace('^', '').trim();
    //sid = line.split("|")[2].split("^")[1];
} catch(ex){
    //console.error(ex);
}

console.log(SID_);
requestMessage(SID_);
//this.emit("requisition", SID_);