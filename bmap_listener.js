require('dotenv').config()

const { Listener } = require("bsv-spv");
const { TransformTx, bobFromRawTx }  = require('bmapjs')

const name = "bmap-plugin";
const ticker = "BSV";
const blockHeight = -10; // Number. If negative then it's number from the tip.
const dataDir = __dirname;
const port = 8080; // Same as Masters port above
const listener = new Listener({ name, ticker, blockHeight, dataDir });

const { connect } = require('amqplib')

var amqp;

async function startAmqp() {

	const connection = await connect(process.env.amqp_url)

	amqp = await connection.createChannel()

	await amqp.assertExchange('sapience')

}

startAmqp()


const onBlock = ({
  header,
  started,
  finished,
  size,
  height,
  txCount,
  transactions,
  startDate,
}) => {
  for (const [index, tx, pos, len] of transactions) {
    console.log(`#${index} tx ${tx.getTxid()} in block ${height}`);

	  let bob = parseTransaction(tx)
  }
};

listener.on("mempool_tx", async ({ transaction, size }) => {

	try {
		const [hex, bob, bmap] = await parseTransaction(transaction)
		console.log(bmap, 'bmap.transaction.discovered')

		amqp.publish('sapience', 'bmap.transaction.discovered', Buffer.from(
			JSON.stringify({ txid: transaction.getTxId(), bob, bmap })
		))

		if (bmap['B']) {
		  //console.log(transformed, 'B')
		}

		if (bmap['MAP']) {
		  //console.log(transformed, 'MAP')


		  if (bmap['MAP'][0].cmd == 'SET' &&
			bmap['MAP'][0].type == 'message') {

			  console.log(bmap, 'Bitchat Detected')

			amqp.publish('sapience', 
				'bmap.bitchat.transaction.detected',
				Buffer.from(
					JSON.stringify({ txid: transaction.getTxId(), bob, bmap })
				))

		  }


		}

	} catch(error) {

	}
});
listener.on("block_reorg", ({ height, hash }) => {
  // Re-org after height
});
listener.on("block_saved", ({ height, hash }) => {
  listener.syncBlocks(onBlock);
});

listener.syncBlocks(onBlock);
listener.connect({ port });


async function parseTransaction(tx) {

	const hex = tx.toHex()

	const bob = await bobFromRawTx(hex)

	let transformed = await TransformTx(bob)

	return [hex, bob, transformed]

}