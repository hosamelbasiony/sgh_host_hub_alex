
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
const ETB  = String.fromCharCode(23); //hex 17
const FS  = String.fromCharCode(28);
const GS  = String.fromCharCode(29);
const RS  = String.fromCharCode(30);

exports.checksum = function( frame ){

    //console.log('checksum');

    let checksum = "00";
    let byteVal = 0
    let sumOfChars = 0;
    let complete = false;

    for ( let idx=0; idx<frame.length; idx++ ) {
        byteVal = Number(frame.charCodeAt(idx));
        if ( !complete ) {
            if ( byteVal == STX.charCodeAt(0) ) {
                sumOfChars = 0;            
            } else if ( byteVal == ETX.charCodeAt(0) || byteVal == ETB.charCodeAt(0) ) {
                sumOfChars += byteVal;
                complete = true;
            } else {
                sumOfChars += byteVal;
            }
        }
        //if ( complete ) break;
    }
    if ( sumOfChars > 0 ) {
        checksum = (sumOfChars % 256).toString(16).toUpperCase();
    }
    return checksum; 
}