// import * as vscode from 'vscode';
// import { request } from 'https';
// import logger from './utils/logger';
// // import { displayWebView } from './webview';


// export async function chuckJoke2() {
//     const joke = getJoke();
//     // debugger;
// }


// export function chuckJoke1() {
//     // logger.debug('beginnning chuck func call')
//     const chuckApiCall = {
//         host: 'api.chucknorris.io',
//         path: '/jokes/random',
//         method: 'GET',
//     };
    
//     // logger.debug('Bout to call request')
//     const req = request(chuckApiCall, response => {
        
//         // logger.debug('pre chunks definition')
//         const chunks: any[] = [];
        
//         response.on('data', (chunk) => {
//             chunks.push(chunk);
//         });
//         // logger.debug('pre response end')
//         response.on('end', () => {
//             const result = JSON.parse(Buffer.concat(chunks).toString());
            
//             logger.debug('ALL CHUCK JOKE DETAILS: ', JSON.stringify(result));
//             vscode.window.showInformationMessage(`Getting Joke from https://api.chucknorris.io/jokes/random`);

//             // const content = `Chuck Joke: \r\n\r\n${ result.value }`
//             // const content = `Chuck Joke: \r\n\r\n${ result }`
            
//             const content = { chuckJoke: result.value };

//             if (result) {
//                 // vscode.workspace.openTextDocument({ language: 'json', content: JSON.stringify(content , undefined, 4) })
//                 // .then( doc => vscode.window.showTextDocument(doc, { preview: false })
//                 // ), (error: any) => {
//                 //     console.error(error)
//                 //     // debugger
//                 // };

//                 // displayWebView(result);
//             }
//         });
//     });
//     req.end();
// }


// function getJoke() {
//     const chuckApiCall = {
//         host: 'api.chucknorris.io',
//         path: '/jokes/random',
//         method: 'GET',
//     };
    
//     // logger.debug('Bout to call request')
//     const req = request(chuckApiCall, response => {
//         // logger.debug('pre chunks definition')
//         const chunks: any[] = [];
//         response.on('data', (chunk) => {
//             chunks.push(chunk);
//         });
//         // logger.debug('pre response end')
//         response.on('end', () => {
//             const result = JSON.parse(Buffer.concat(chunks).toString());
//             logger.debug('ALL CHUCK JOKE DETAILS: ', JSON.stringify(result));
//             vscode.window.showInformationMessage(`Getting Joke from https://api.chucknorris.io/jokes/random`);
//             // const content = `Chuck Joke: \r\n\r\n${ result.value }`
//             // const content = `Chuck Joke: \r\n\r\n${ result }`
//             const content = { chuckJoke: result.value };
//             if (result) {
//                 return result;
//             }
//             else {
//                 return 'something went wrong...';
//             }
//         });
//     });
//     req.end();
//     return req;
// }