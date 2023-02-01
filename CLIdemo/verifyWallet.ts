//
// INTERLOCK NETWORK - VERIFY WALLET
// PSP34 ACCESS NFT AUTHENTICATION
//

// imports
import { io } from 'socket.io-client';
import { fork } from 'child_process';
import * as path from 'path';
const setWaiting = path.resolve('setWaiting.js');

// specify color formatting
import * as color from 'cli-color';
const red = color.red.bold;
const green = color.green.bold;
const blue = color.blue.bold;
const cyan = color.cyan.bold;
const yellow = color.yellow.bold;
const magenta = color.magenta.bold;

// utility functions
import {
  contractGetter,
  setupSession,
  sendMicropayment,
  terminateProcess
} from "./utils";

// constants
const TRUE = '0x74727565';
const FALSE = '0x66616c7365';
const ISAUTHENTICATED = '0x697361757468656e74696361746564';
const ISWAITING = '0x697377616974696e67';

async function verifyWallet(wallet, socket) {

  try {

    console.log(green(`ACCESSNFT:`) +
      ` initiating authentication process for wallet ` + magenta(`${wallet}`));

    // establish connection with blockchain
    const [ api, contract ] = await setupSession('verifyWallet');

    // track nfts
    let notAuthenticated = false;
    let notAuthenticatedId;

    console.log(yellow(`ACCESSNFT:`) +
      ` checking if waiting for micropayment from wallet ` + magenta(`${wallet}`));
    console.log(yellow(`ACCESSNFT:`) +
      ` and checking that wallet contains unauthenticated nfts`);
console.log(wallet)
    // get nft collection for wallet
    var [ gasRequired, storageDepositRequired, RESULT_collection, OUTPUT_collection ] =
      await contractGetter(
        api,
        socket,
        contract,
        'verifyWallet',
        'getCollection',
	wallet,
      );

      // find nft to authenticate
      const array = Array.from(OUTPUT_collection.ok.ok);
      let nft: any;
      for (nft of array) {

        // get attribute isathenticated state per nft
        var [ gasRequired, storageDepositRequired, RESULT_authenticated, OUTPUT_authenticated ] =
          await contractGetter(
            api,
            socket,
            contract,
            'verifyWallet',
            'psp34Metadata::getAttribute',
            {u64: nft.u64},
            ISAUTHENTICATED,
          );
        let authenticated = JSON.parse(JSON.stringify(OUTPUT_authenticated));

        // record nft id of one that has not yet been authenticated
        if (authenticated.ok == FALSE) {
          notAuthenticated = true;
          notAuthenticatedId = nft.u64;
        }

        // get attribute isathenticated state
        var [ gasRequired, storageDepositRequired, RESULT_waiting, OUTPUT_waiting ] =
          await contractGetter(
            api,
            socket,
            contract,
            'verifyWallet',
            'psp34Metadata::getAttribute',
            {u64: nft.u64},
            ISWAITING,
          );
        let waiting = JSON.parse(JSON.stringify(OUTPUT_waiting));
        
        // if any one of wallet's nfts are waiting, they must resolve this first
        if (waiting.ok == TRUE) {

          console.log(red(`ACCESSNFT:`) +
            ` need wallet ` + magenta(`${wallet}`) + ` to return validation transfer`);

          terminateProcess(socket, 'verifyWallet', 'still-waiting', [ notAuthenticatedId, wallet ]);
        }
      }

    // if after checking OUTPUT_collection there are no nfts to authenticate
    if (notAuthenticated == false) {

      console.log(red(`ACCESSNFT:`) +
        ` all nfts in wallet ` + magenta(`${wallet}`) + ` already authenticated`);

      terminateProcess(socket, 'verifyWallet', 'all-nfts-authenticated', wallet);

    // or send micropayment to unauthenticated nft
    } else if (notAuthenticated == true) {

      await sendMicropayment(
        api,
        wallet,
        notAuthenticatedId
      );
        
      // change contract state to indicate waiting for return micropayment transaction
      const setWaitingChild = fork(setWaiting);
      setWaitingChild.send({id: notAuthenticatedId, wallet: wallet});

      terminateProcess(socket, 'verifyWallet', 'now-waiting', [ notAuthenticatedId, wallet ]);
    }

  } catch(error) {

    console.log(red(`ACCESSNFT: `) + error);
    terminateProcess(socket, 'verifyWallet', 'process-error', wallet);
  }
}

// entrypoint
process.on('message', wallet => {

  // setup socket connection with autheticateWallet script
  var socket = io('http://localhost:3000');
  socket.on('connect', () => {

    console.log(blue(`ACCESSNFT:`) +
      ` verifyWallet socket connected, ID ` + cyan(`${socket.id}`));
    
    verifyWallet(wallet, socket).catch((error) => {

      console.error(error);
      process.exit(-1);
    });
  });
});
