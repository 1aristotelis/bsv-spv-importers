require("dotenv").config();

const { Listener } = require("bsv-spv");

const name = "lockup-plugin";
const ticker = "BSV";
const blockHeight = 807000; // Number. If negative then it's number from the tip.
const dataDir = __dirname;
const port = 8080; // Same as Masters port above
const listener = new Listener({ name, ticker, blockHeight, dataDir });

const { connect } = require("amqplib");

const detectLockupFromTxHex = require("./utils/lockup");

var amqp;

async function startAmqp() {
  const connection = await connect(process.env.amqp_url);

  amqp = await connection.createChannel();

  await amqp.assertExchange("sapience");
}

startAmqp();

const onBlock = async ({
  header,
  started,
  finished,
  size,
  height,
  txCount,
  transactions,
  startDate,
}) => {

  if(finished){
    amqp.publish(
      "sapience",
      "spv.block.synced",
      Buffer.from(
        JSON.stringify({
          header, 
          txCount,
          size,
          height,
          startDate
        })
      )
    );
  }

  for (const [index, tx, pos, len] of transactions) {
    const hex = tx.toHex();

    let lockup = detectLockupFromTxHex(hex);

    if (lockup) {
      const { address, satoshis, lockUntilHeight } = lockup
      console.log(`lock.discovered.block.#${height}`, {
            txid: tx.hash,
            hex,
            address,
            satoshis,
            lockUntilHeight,
            blockHeight: height,
            blockHeader: header,
      });

      amqp.publish(
        "sapience",
        "block.lockup.transaction.discovered",
        Buffer.from(
          JSON.stringify({
            txid: tx.hash,
            hex,
            address,
            satoshis,
            lockUntilHeight,
            blockHeight: height,
            blockHeader: header,
          })
        )
      );
    }
  }
};

listener.on("mempool_tx", async ({ transaction, size }) => {
  try {
    const hex = transaction.toHex();

    let lockup = detectLockupFromTxHex(hex);

    if (lockup) {
      const { address, satoshis, lockUntilHeight } = lockup
      console.log("lock.discovered.mempool", {
            txid: transaction.hash,
            address,
            satoshis,
            lockUntilHeight,
            hex,
        });

      amqp.publish(
        "sapience",
        "mempool.lockup.transaction.discovered",
        Buffer.from(
          JSON.stringify({
            txid: transaction.hash,
            address,
            satoshis,
            lockUntilHeight,
            hex,
          })
        )
      );
    }
  } catch (error) {}
});
listener.on("block_reorg", ({ height, hash }) => {
  // Re-org after height
});
listener.on("block_saved", ({ height, hash }) => {
  listener.syncBlocks(onBlock);
});

listener.syncBlocks(onBlock);
listener.connect({ port });
