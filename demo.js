#!/home/tony/node/bin/node

import 'dotenv/config';

import os from 'os';
import { Command } from 'commander';
import chalk from 'chalk';
import axios from 'axios';
import { oraPromise } from 'ora';
import cheerio from 'cheerio';
import { promises as fs } from 'fs';
import $ from 'shelljs';

import * as pgp from 'openpgp';

import notifier from 'node-notifier';
const NotifySend = notifier.NotifySend;
const notifySendNotifier = new NotifySend();

const program = new Command();

program
  .name('demo')
  .description('demonstration of commander and some cool node stuff')
  .version('0.8.0');


const BOOK_WEBSITE = "https://personal.thepolygram.com/Annotations.html";

const spin = (desc, cb) => {
  return oraPromise(cb, {"text": "downloading website"})
};


/* - - - - - - - - - - - - - - - - - - - - - */

const getInfo = () => {
  const obj = {
    type: os.type(),
    platform: os.platform(),
    release: os.release(),
    version: os.version(),
    hostname: os.hostname(),
    userInfo: os.userInfo(),
    uptime: os.uptime()
  };
  console.log(JSON.stringify(obj, null, 2));
}

const getIP = () => {
  axios.get("http://ifconfig.me").
    then(resp => {
      console.log(`${chalk.cyanBright("IP:")} ${resp.data}`);
    }).
    catch(e => console.error(e));
}

const getBooks = () => {
  spin("downloading website", () => axios.get(BOOK_WEBSITE)).
    then(resp => {
      const tmp = cheerio.load(resp.data);
      return tmp;
    }).
    catch(err => console.error("failure")).
    then($ => {
      $("work").each((i, e) => console.log($(e).attr("thetitle")));
    });
};

const countLinesShell = (file) => {
  const res = $.exec(`wc -l ${file}`, { "silent": true });
  console.log(res.stdout.trim());
}

const countLinesFS = (file) => {
  fs.readFile(file, 'utf-8')
    .then(content => {
      console.log(content.split('\n').length-1);
    });
};

const symEncrypt = (astring) => {
  pgp.createMessage({ text: astring }).
    then(msg =>{
      return pgp.encrypt({ message: msg, passwords: process.env.SECRET });
    }).
    then(ciph => {
      console.log(ciph);
    });
};

const linuxNotify = (amessage) => {
  notifySendNotifier.notify({
    title: 'demo.js',
    message: amessage,
    icon: `${$.pwd()}/imgs/bunbury.jpg`,
    wait: true,
    timeout: 5
  });
};

/* - - - - - - - - - - - - - - - - - - - - - */


program.command('info')
  .description('Display various OS data')
  .action(getInfo);

program.command('ip')
  .description('Get external IP address')
  .action(getIP);

program.command('books')
  .description('Get list of books in my annotations')
  .action(getBooks);

program.command('stat')
  .description('stat a file')
  .argument('<string>', 'string to split')
  .action(file => {
    fs.stat(file).
      then(console.log);
  });

program.command('wcl')
  .description('count lines in a file (using shelljs)')
  .argument('<string>', 'a filename')
  .action(file => countLinesShell(file));

program.command('wcl2')
  .description('count lines in a file (using fs)')
  .argument('<string>', 'a filename')
  .action(file => countLinesFS(file));

program.command('env')
  .description('get the value of variable in .env')
  .argument('<string>', 'variable')
  .action(variable => {
    console.log(process.env[variable]);
  });

program.command('enc')
  .description('get the value of variable in .env')
  .argument('<string>', 'string to encrypt')
  .action(content => {
    symEncrypt(content);
  });

program.command('notify')
  .description('send a notification with a message (GNU/Linux)')
  .argument('<string>', 'the message')
  .action(message => {
    linuxNotify(message);
  });


program.parse();

