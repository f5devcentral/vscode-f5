import * as vscode from 'vscode';
import { request } from 'https';


export function chuckJoke() {
    // console.log('beginnning chuck func call')
    const chuckApiCall = {
        host: 'api.chucknorris.io',
        path: '/jokes/random',
        method: 'GET',
    }
    
    // console.log('Bout to call request')
    const req = request(chuckApiCall, response => {
        
        // console.log('pre chunks definition')
        const chunks: any[] = [];
        
        response.on('data', (chunk) => {
            chunks.push(chunk);
        });
        // console.log('pre response end')
        response.on('end', () => {
            const result = JSON.parse(Buffer.concat(chunks).toString());
            
            console.log('ALL CHUCK JOKE DETAILS: ', JSON.stringify(result));
            vscode.window.showInformationMessage(`Getting Joke from https://api.chucknorris.io/jokes/random`);

            // const content = `Chuck Joke: \r\n\r\n${ result.value }`
            // const content = `Chuck Joke: \r\n\r\n${ result }`
            
            const content = { chuckJoke: result.value }

            if (result) {
                vscode.workspace.openTextDocument({ language: 'json', content: JSON.stringify(content , undefined, 4) })
                .then( doc => vscode.window.showTextDocument(doc, { preview: false })
                ), (error: any) => {
                    console.error(error)
                    // debugger
                }
            }
        });
    });
    req.end();
}