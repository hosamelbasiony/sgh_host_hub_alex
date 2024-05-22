const colors            = require("colors");

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

const parse = (msg, device) => {

    let msgTypeIsQuery = false;

    let result = {
        sid: '',
        sampleid: "",
        devicename: device.name,
        deviceid: device.id,
        lines: []
    };

    let astmLines = msg.split(CR);
    if( astmLines.length == 1 ) astmLines = msg.split("\n");
   
    if (astmLines) {

        for (let line of astmLines) {

            console.log((line).cyan);

            let fields = line.split("|");

            if (fields.length) {

                let lineType = fields[0];

                // console.error(lineType);

                if (lineType.includes("Q")) {
                    //if ( lineType.match(/^\dQ\|/g) ) {

                    //prepare order
                    msgTypeIsQuery = true;
                    let SID_ = false;

                    let rackNo = '';
                    let tubePosition = '';
                    let sampleIdAttr = '';

                    try {
                        SID_ = line.split("|")[2].replace('^', '').trim();
                        if (device.name == 'CA-600') {
                            rackNo = line.split("|")[2].split('^')[0];
                            tubePosition = line.split("|")[2].split('^')[1];
                            SID_ = line.split("|")[2].split('^')[2];
                            sampleIdAttr = line.split("|")[2].split('^')[3];
                        }
                        //sid = line.split("|")[2].split("^")[1];
                    } catch (ex) {
                        //console.error(ex);
                    }

                    // if ( SID_ ) console.log(SID_);
                } else if (lineType.includes("P")) {

                    let sid = false;

                    if (device.name == 'ABL') sid = line.split("|")[3];

                    if (sid) {
                        result = {
                            sid: sid,
                            sampleid: sid,
                            devicename: device.name,
                            deviceid: device.id,
                            lines: []
                        };
                    }

                } else if (lineType.includes("O")) {
                    //} else if ( lineType.match(/^\dO\|/g) ) {

                    console.log("order line: ", line);
                    console.log("device: ", device.name);

                    //if result obj populated => save                

                    let sid = false;

                    try {
                        if (device.name == 'Ruby') sid = line.split("|")[2].split('^')[0];
                        else if (device.name == 'CA-600') sid = line.split("|")[3].split('^')[2].trim();
                        // else if ( device.name == 'ABL' ) sid = line.split("|")[3].split('^')[1];
                        else if (device.name == 'Gem') sid = line.split("|")[3];
                        else if ( device.name == 'XN530' ) sid = line.split("|")[3].split('^')[2].trim();
                        else sid = line.split("|")[2].replace('^', '').trim();
                    } catch (ex) {
                        console.log(JSON.stringify(ex, undefined, 2));
                    }

                    // if ( result.lines.length && result.sampleid != sid ) saveResult( JSON.parse(JSON.stringify(result)) ).then ( res => console.log(res) );

                    if (sid) {
                        result = {
                            sid: sid,
                            sampleid: sid,
                            devicename: device.name,
                            deviceid: device.id,
                            lines: []
                        };
                    }

                } else if (lineType.includes("R")) {
                    // } else if ( lineType.match(/^\dR\|/g) ) {

                    let code = 0;

                    if (device.name == 'Ruby') code = line.split("|")[2].split('^')[6];
                    else if (device.name == 'CA-600') code = line.split("|")[2].split('^')[3];
                    else if (device.name == 'Gem') code = line.split("|")[2].split('^')[3];
                    else if (device.name == 'ABL') code = line.split("|")[2].split('^')[3];
                    else if (device.name == 'Stago') code = line.split("|")[2].split('^')[3];
                    else if (device.name == 'XN530') code = line.split("|")[2].split('^')[4];
                    else code = line.split("|")[2].split('^')[3].split('/')[0];

                    // console.log("code", code);

                    let type_ = '';
                    if (line.split("|")[2].split('^').length > 9) type_ = line.split("|")[2].split('^')[10];

                    let result_ = line.split("|")[3];
                    if (device.name == "SysmexUrine" && result_.indexOf(("^") > -1)) result_ = result_.split("^")[0];
                    
                    let tmpRes = result_.split("");
                    result_ = "";
                    for (let d of tmpRes) if (d == "^") result_ = ""
                    else result_ += d;


                    // console.log(type_);

                    if (type_.trim() == 'F' || device.name != 'Archi') { // Final result only in Archi
                        // const filteredCodes = await this.connection.models.deviceCode.findAll({
                        //     where: {
                        //         upload: true,
                        //         deviceId: device.id,
                        //         hostCode: code
                        //     }
                        // });

                        // // console.log(code, device.id, filteredCodes)

                        // // let filteredCodes = device.codes.filter( x => x.upload && x.code == code);
                        for (let filteredCode of [{
                            code,
                            result: result_,
                            hostcode: code,
                            parameterId: "paramId",
                            parameter_id: "paramId",
                            type_
                        }]) {

                            // let fltrd = result.lines.find(x => x.code == code);
                            // if (!fltrd) 
                            result.lines = [...result.lines, {
                                code,
                                result: result_,
                                hostcode: code,
                                parameterId: filteredCode.paramId,
                                parameter_id: filteredCode.paramId,
                                type_
                            }];
                        }
                    }

                }

            }
        }
    }

    console.log("EMITTED RESULT: ", JSON.stringify(result, undefined, 2).yellow);

}

let msg = `1H|\^&|||    XN-530^00-22^12218^^^^BQ391107||||||||E1394-97
C2
2P|1|||30002232|^yaser^mahmoud|||U|||||^||||||||||||^^^
03
3C|1||
2B
4O|1||^^                866426^M|^^^^WBC\^^^^RBC\^^^^HGB\^^^^HCT\^^^^MCV\^^^^MCH\^^^^MCHC\^^^^PLT\^^^^RDW-SD\^^^^RDW-CV\^^^^PDW\^^^^MPV\^^^^P-LCR\^^^^PCT\^^^^NEUT#\^^^^LYMPH#\^^^^MONO#\^^^^EO#\^^^^BASO#\^^^^NEUT%\^^^^LYMPH%\^^^^MONO%\^^^^EO%53
5\^^^^BASO%\^^^^IG#\^^^^IG%\^^^^MICROR\^^^^MACROR\^^^^OPEN|||||||N||||||||||||||F
71
6C|1||
2E
7R|1|^^^^WBC^1|7.00|10*3/uL||N||F||||20240521195013
47
0R|2|^^^^RBC^1|5.18|10*6/uL||N||F||||20240521195013
46
1R|3|^^^^HGB^1|14.9|g/dL||N||F||||20240521195013
D7
2R|4|^^^^HCT^1|42.3|%||N||F||||20240521195013
C1
3R|5|^^^^MCV^1|81.7|fL||L||F||||20240521195013
5C
4R|6|^^^^MCH^1|28.8|pg||N||F||||20240521195013
79
5R|7|^^^^MCHC^1|35.2|g/dL||N||F||||20240521195013
25
6R|8|^^^^PLT^1|301|10*3/uL||N||F||||20240521195013
30
7R|9|^^^^NEUT%^1|86.3|%||W||F||||20240521195013
5E
0R|10|^^^^LYMPH%^1|7.4|%||W||F||||20240521195013
97
1R|11|^^^^MONO%^1|5.9|%||W||F||||20240521195013
4B
2R|12|^^^^EO%^1|0.1|%||W||F||||20240521195013
9B
3R|13|^^^^BASO%^1|0.3|%||N||F||||20240521195013
27
4R|14|^^^^NEUT#^1|6.04|10*3/uL||W||F||||20240521195013
07
5R|15|^^^^LYMPH#^1|0.52|10*3/uL||W||F||||20240521195013
54
6R|16|^^^^MONO#^1|0.41|10*3/uL||W||F||||20240521195013
03
7R|17|^^^^EO#^1|0.01|10*3/uL||W||F||||20240521195013
5C
0R|18|^^^^BASO#^1|0.02|10*3/uL||N||F||||20240521195013
DF
1R|19|^^^^IG%^1|0.3|%||W||F||||20240521195013
9F
2R|20|^^^^IG#^1|0.02|10*3/uL||W||F||||20240521195013
4E
3R|21|^^^^RDW-SD^1|37.2|fL||N||F||||20240521195013
53
4R|22|^^^^RDW-CV^1|12.1|%||N||F||||20240521195013
C2
5R|23|^^^^MICROR^1|2.5|%||N||F||||20240521195013
B0
6R|24|^^^^MACROR^1|4.3|%||N||F||||20240521195013
AA
7R|25|^^^^PDW^1|11.0|fL||N||F||||20240521195013
8B
0R|26|^^^^MPV^1|10.0|fL||N||F||||20240521195013
8C
1R|27|^^^^P-LCR^1|24.5|%||N||F||||20240521195013
76
2R|28|^^^^PCT^1|0.30|%||N||F||||20240521195013
F9
3R|29|^^^^Lymphopenia||||A||F||||20240521195013
18
4R|30|^^^^Blasts/Abn_Lympho?|190|||A||F||||20240521195013
E5
5R|31|^^^^Left_Shift?|300|||A||F||||20240521195013
47
6R|32|^^^^Atypical_Lympho?|190|||A||F||||20240521195013
77
7R|33|^^^^NRBC?|20|||||F||||20240521195013
16
0R|34|^^^^RBC_Agglutination?|60|||||F||||20240521195013
7B
1R|35|^^^^Turbidity/HGB_Interference?|90|||||F||||20240521195013
ED
2R|36|^^^^Iron_Deficiency?|80|||||F||||20240521195013
DF
3R|37|^^^^HGB_Defect?|90|||||F||||20240521195013
73
4R|38|^^^^Fragments?|0|||||F||||20240521195013
68
5R|39|^^^^PLT_Clumps?|10|||||F||||20240521195013
B7
6R|40|^^^^Positive_Diff||||A||F||||20240521195013
B9
7R|41|^^^^Positive_Morph||||A||F||||20240521195013
48
0R|42|^^^^SCAT_WDF|PNG&R&20240522&R&2024_05_21_19_50_866426_WDF.PNG|||N||F||||20240521195013
81
1R|43|^^^^SCAT_WDF-CBC|PNG&R&20240522&R&2024_05_21_19_50_866426_WDF_CBC.PNG|||N||F||||20240521195013
9F
2R|44|^^^^DIST_RBC|PNG&R&20240522&R&2024_05_21_19_50_866426_RBC.PNG|||N||F||||20240521195013
7A
3R|45|^^^^DIST_PLT|PNG&R&20240522&R&2024_05_21_19_50_866426_PLT.PNG|||N||F||||20240521195013
AE
4C|1||
2C
5L|1|N
08
`;

parse(msg, {
    _id: '65',
    id: 65,
    name: 'XN530',
    codes: []
});