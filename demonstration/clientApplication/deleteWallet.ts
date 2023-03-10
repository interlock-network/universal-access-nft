//
// INTERLOCK NETWORK & ALEPH ZERO
// PSP34 UNIVERSAL ACCESS NFT - CLIENT DELETE WALLET
//

// imports
import { io } from 'socket.io-client';
import * as prompts from 'prompts';
import * as crypto from 'crypto';
import * as fs from 'fs';

// specify color formatting
import * as color from 'cli-color';
const red = color.red.bold;
const green = color.green.bold;
const blue = color.blue.bold;
const cyan = color.cyan;
const yellow = color.yellow.bold;
const magenta = color.magenta;

// utility functions
import {
  returnToMain,
} from "./utils";

// environement constants
const WALLET = JSON.parse(fs.readFileSync('.wallet.json').toString());
const CLIENT_ADDRESS = WALLET.CLIENT_ADDRESS;

async function deleteWallet() {

  try {

		// warning notification of impending deletion
    console.log(red(`\nUA-NFT`) + color.bold(`|CLIENT-APP: `) +
      color.bold(`Do you really wish to delete the wallet you`));
    console.log(red(`UA-NFT`) + color.bold(`|CLIENT-APP: `) +
      color.bold(`associated with account address`));
    console.log(red(`UA-NFT`) + color.bold(`|CLIENT-APP: `) +
      magenta(`${CLIENT_ADDRESS} `) + color.bold(`?\n`));
            
    // prompt
    //
    // proceed to delete wallet?
    (async () => {

      // get response
      var responseChoice = await prompts({
        type: 'confirm',
        name: 'choice',
        message: 'Delete wallet?',
      });
      const choice = responseChoice.choice
      console.log('');

			// nah, kick back to main menu
      if (choice == false) {

        process.send('done');
        process.exit();
      }
  
			// overwrite .wallet.json with emptiness
      fs.writeFileSync('.wallet.json', '');

			// confirmation notification that overwrite was successful
      console.log(green(`UA-NFT`) + color.bold(`|CLIENT-APP: `) +
        color.bold(`You deleted your wallet.\n`));
      console.log(green(`UA-NFT`) + color.bold(`|CLIENT-APP: `) +
        color.bold(`You will need to re-add a wallet if you`));
      console.log(green(`UA-NFT`) + color.bold(`|CLIENT-APP: `) +
        color.bold(`want to continue using this application.\n`));
  
      await returnToMain('return to main menu to add new wallet or quit');

    })();
  } catch(error) {

    console.log(red(`UA-NFT`) + color.bold(`|CLIENT-APP: `) + error);

    process.send('program-error');
    process.exit();
  }
}

deleteWallet();




