const bsv = require("bsv")
const LOCKUP_PREFIX = `2097dfd76851bf465e8f715593b217714858bbe9570ff3bd5e33840a34e20ff0262102ba79df5f8ae7604a9830f03c7933028186aede0675a16f025dc4f8be8eec0382201008ce7480da41702918d1ec8e6849ba32b4d65b1e40dc669c31a1e6306b266c`;

const changeEndianness = string => {// change endianess of hex value before placing into ASM script
    const result = [];
    let len = string.length - 2;
    while (len >= 0) {
      result.push(string.substr(len, 2));
      len -= 2;
    }
    return result.join('');
}
const hex2Int = hex => {
    const reversedHex = changeEndianness(hex);
    return parseInt(reversedHex, 16);
}

function detectLockupFromTxHex(txhex) {
    const tx = new bsv.Transaction(txhex)

    let lockupData = null

    for (let i = 0; i < tx.outputs.length; i++) {
        let output = tx.outputs[i]
        if (output.script.toHex().includes(LOCKUP_PREFIX)){
            const hexAddr = output.script.chunks[5]?.buf.toString("hex")
            const script = bsv.Script.fromASM(`OP_DUP OP_HASH160 ${hexAddr} OP_EQUALVERIFY OP_CHECKSIG`)
            const address = bsv.Address.fromScript(script).toString()
            const hexBlock = output.script.chunks[6].buf.toString("hex")
            const lockUntilHeight = hex2Int(hexBlock)
            const satoshis = output.satoshis
            lockupData = {
                address,
                satoshis,
                lockUntilHeight
            }
            break;
        }
    }

    return lockupData
    
}

module.exports = detectLockupFromTxHex