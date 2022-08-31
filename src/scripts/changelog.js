let fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

// src/scripts/changelog.js
const text = fs.readFileSync(path.join('CHANGELOG.md'), "utf-8");


// trying to take arg for version...
// if(args[0]) {
//     const rx2 = new RegExp(`## \[${args[0]}` + "\].+([\\s\\w\\>\\'\\-\\/]+)", 'g');
//     const rx3 = /## \[\d.\d.\d\].+([\s\w\>\'\-\/]+)(?=---)/;
    
//     const b2 = rx2.exec(text);

//     const b3 = b2;
//     // const rx = /## \[3.8.5\].+([\s\w\>\'\-\/]+)/;
// }

// currently just returns the most recent or first match
const rx = /## \[\d.\d.\d\].+([\s\w\>\'\-\/]+)(?=---)/;

const body = rx.exec(text);

return console.log(body[0]);

// debugger;


