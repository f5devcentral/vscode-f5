import * as vscode from 'vscode';
import { request } from 'https';
// const fetch = require('node-fetch');


export class f5Api {
    hi() {
        return 'hi';
    }

    low() {
        console.log('inside LOW')
    }
    
    funcSole(func: string) {
        console.log(`inside funcSole: ${func}`)
        return func + '-sole-brother';
    }

    getFastTemplates(host: string, password: string) {
        console.log('beginnning NEW chuck func call')
        console.log(`Serial: ${host} - ${password}`)
        
       
        // const authToken = getAuthToken(newHost, password);
        // console.log(`authToken: ${JSON.stringify(authToken)}`)
        
    }
}

// function getAuthToken(host: string, password: string) {
//     // var host = 
//     const newHost: [] = host.split('@')
//     console.log(`newHost: ${JSON.stringify(newHost)}`)

//     fetch(`https://${newHost[1]/}/mgmt/shared/authn/login`, {
//         method: 'post',
//         body: {
//             "username": newHost[0],
//             "password": password
//         }
//     })
// }

// function callAPI




// export function chuckJoke() {
//     // console.log('beginnning chuck func call')
//     const chuckApiCall = {
//         host: 'api.chucknorris.io',
//         path: '/jokes/random',
//         method: 'GET',
//     }
    
//     // console.log('Bout to call request')
//     const req = request(chuckApiCall, response => {
        
//         // console.log('pre chunks definition')
//         const chunks: any[] = [];
        
//         response.on('data', (chunk) => {
//             chunks.push(chunk);
//         });
//         // console.log('pre response end')
//         response.on('end', () => {
//             const result = JSON.parse(Buffer.concat(chunks).toString());
            
//             console.log('chuck joke: ', result.value);
//             vscode.window.showInformationMessage(`Getting Joke from https://api.chucknorris.io/jokes/random`);

//             if (result) {
//                 vscode.workspace.openTextDocument({ content: `Chuck Joke: \r\n\r\n${ result.value }` ).then(
//                     doc => vscode.window.showTextDocument(doc, { preview: false })
//                 ), (error: any) => {
//                     console.error(error)
//                     debugger
//                 }
//             }
//         });
//     });
//     req.end();
// }
// }