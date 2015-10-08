"use strict";

let fs = require('fs');
let path = require('path');
let crypto = require('crypto');
let child_process = require('child_process');

let rimraf = require('rimraf');
let Fiber = require('fibers');

let NUM_FILES = 500;
let BIG_REPS = 500;
let SITE_DIR = 'site';
let PRIVATE_DIR = path.join(SITE_DIR, 'private');
let METEOR_BIN = '/usr/local/bin/meteor';
let LOG_DIR = 'logs';

let random5 = function() { return crypto.randomBytes(5).toString('hex'); };

let samples = {
  js: 'var _RANDOM_ = function() {}\n',
  css: '#_RANDOM_ { color: red; }\n',
  txt: '_RANDOM_'
};

let responses = {
  loaded: '=> Started your app.',
  reloaded: '=> Meteor server restarted'
};
for (var resp in responses) {
  responses[resp] = new RegExp(responses[resp]);
}

let rebuildRE = /Rebuild App: ([0-9\.]+)/;

let runMeteor = function() {
  let fiber = Fiber.current;

  let meteor = child_process.spawn(METEOR_BIN, ['-p', '6020'], {
    cwd: SITE_DIR,
    env: { METEOR_PROFILE: 50, HOME: process.env.HOME }
  });

  let obj = { stdout: '' };

  meteor.on('error', (err) => { console.log(err); });
  meteor.stderr.on('data', (data) => { console.log(data.toString('utf8')); });

  meteor.stdout.on('data', (data) => {
    let str = data.toString('utf8'); 
    obj.stdout += str;
    // console.log(str);

    let match = rebuildRE.exec(str);
    if (match) {
      obj.rebuildTime = match[1];
    }

    if (str.match(responses.loaded)) {
      console.log('* initial load complete');
      fs.writeFileSync(path.join(SITE_DIR, 'reload.js'), `${Math.random()};`);
    } else if (str.match(responses.reloaded)) {
      console.log('* reload complete');
      meteor.kill();
      fiber.run(obj);
    }
  });

  return Fiber.yield();
};

// if this was anything real obviously we'd want fiber'ized versions of the sync methods below
Fiber(() => {
  let summary = {};

  for (let which in samples) {
    ['small', 'big'].forEach((size) => {
      let reps = size === 'big' ? BIG_REPS : 1;
      let name = `${which}-${size}`;

      console.log(`Running "${name}"...`);

      try { rimraf.sync(PRIVATE_DIR); }
      catch (err) { }

      fs.mkdirSync(PRIVATE_DIR);

      for (let i=0; i < NUM_FILES; i++) {
        let sample = samples[which].repeat(reps).replace(/_RANDOM_/g, random5);
        fs.writeFileSync(path.join(PRIVATE_DIR, random5()+'.'+which), sample);
      }

      let data = runMeteor();
      summary[name] = data.rebuildTime;
      fs.writeFileSync(path.join(LOG_DIR, name+'.log'), data.stdout);
    });
  };

  let out = `
Each build contains ${NUM_FILES} files in "${PRIVATE_DIR}".
"Small" builds contain 1 line each.
"Big" builds contain ${BIG_REPS} lines each.
To trigger the rebuild, a single file is modified in the APP.

Results:

`;
  for (let name in summary)
    out += `* ${" ".repeat(10-name.length)} ${name}: ${summary[name]} ms\n`;

  fs.writeFileSync('SUMMARY.md', out);

}).run();
