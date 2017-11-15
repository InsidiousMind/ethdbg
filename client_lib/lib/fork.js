#! /usr/bin/env node
var URL = require("url");
var fs = require("fs");
var yargs = require("yargs/yargs");
var Web3 = require("web3");
var Ganache = require("../../ganache-core/index.js");

var parser = yargs()
.option("unlock", {
  type: "string",
  alias: "u"
});
var argv = parser.parse(process.argv);
var logger = console;
var options = {
  port: "8545",
  hostname: argv.h || argv.hostname,
  debug: argv.debug,
  seed: argv.s || argv.seed,
  mnemonic: argv.m || argv.mnemonic,
  total_accounts: argv.a || argv.accounts,
  blocktime: argv.b || argv.blocktime,
  gasPrice: argv.g || argv.gasPrice,
  gasLimit: argv.l || argv.gasLimit || 3000000,
  accounts: null, // was parseAccounts(accounts)
  unlocked_accounts: argv.unlock,
  fork: argv.f || argv.fork || 'http://localhost:8545',
  network_id: argv.i || argv.networkId,
  verbose: argv.v || argv.verbose,
  secure: argv.n || argv.secure || false,
  db_path: argv.db || null,
  account_keys_path: argv.acctKeys || null,
  logger: logger
}

// returns a JSON object
// Modify ganache to give a 'vm' object back
// 'vm.on()' will fill socket rust is communicating with to awaken Rust process
// Rust enters debug ptrace of Eth EVM
function fork() {
  var output;
  var fork_address;

  // Make sure we don't use the same port as the testRPC we are forking from
  var split = options.fork.split("@");
  fork_address = split[0];
  var block;
  if (split.length > 1) {
    block = split[1];
  }

  if (URL.parse(fork_address).port == options.port) {
    options.port = (parseInt(options.port) + 1);
  }
  options.fork = fork_address + (block != null ? "@" + block : "");
  server = Ganache.server(options);
  
  server.listen(options.port, options.hostname, function(err, result) {
    if (err) {
      // output JSON with error to Rust process
      fs.writeSync(1, JSON.stringify({err: err}));
      return;
    }

    var state = result ? result : server.provider.manager.state;
    console.log(" VM ");
    console.log(state.blockchain.vm);

    if (options.fork) {
      console.log("");
      console.log("Forked Chain");
      console.log("==================");
      console.log("Location:    " + fork_address);
      //console.log("Block:       " + web3.toBigNumber(state.blockchain.fork_block_number).toString(10));
      console.log("Network ID:  " + state.net_version);
      console.log("Time:        " + (state.blockchain.startTime || new Date()).toString());
    }
    
    console.log("Listening on " + (options.hostname || "localhost") + ":" + options.port);

    state.blockchain.vm.on('step', function () {
      console.log("Contract Got to first instruction!");
    });
  });

  /* Pipe output to Rust process */
  output = JSON.stringify({});
  fs.writeSync(1, output);

  /** Fall into Rust Code from here on out **/
}

fork();
