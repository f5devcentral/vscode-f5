import * as vscode from 'vscode';
import { getAuthToken, callHTTP } from './coreHTTPS';



// export function get


// const fast = require('@f5devcentral/f5-fast-core');


// // https://github.com/zinkem/fast-docker/blob/master/templates/index.yaml

// export function fastTest1(input: string) {

//     console.log(`fast renderHtmlPreview input string below`);
//     console.log(input);
    
// const ymldata = `
//     view:
//       message: Hello!
//     definitions:
//       body:
//         template:
//           <body>
//             <h1>{{message}}</h1>
//           </body>
//     template: |
//       <html>
//         {{> body}}
//       </html>
// `;

// console.log(`fast renderHtmlPreview ymlData string below`);
// console.log(ymldata);

//     // fast.Template.loadYaml(input)
//     //     .then(template => {
//     //         console.log(template.getParametersSchema());
//     //         console.log(template.render({ message: "my message!!!" }));
//     //     });
// }