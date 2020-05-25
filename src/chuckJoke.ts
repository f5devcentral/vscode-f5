import * as vscode from 'vscode';
import { request } from 'https';






export function manyJokes() {
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "I am long running!",
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
        });

        //https://github.com/jedwards1211/progress-issue-demo/blob/9710fa40195ef20afb61ec211c9bf55a39ceb8bb/src/extension.ts
        // progress.report({ increment: 0 });
        
        let amount: number = 0;

        while (amount <= 4) {
            progress.report({ message: `status# ${amount}`});
            amount++;
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // setTimeout(() => {
        //     // progress.report({ increment: 10, message: "I am long running! - still going..." });
        //     progress.report({ message: "I am long running! - still going..." });
        // }, 1000);

        // setTimeout(() => {
        //     // progress.report({ increment: 40, message: "I am long running! - still going even more..." });
        //     progress.report({ message: "I am long running! - still going even more..." });
        // }, 2000);

        // setTimeout(() => {
        //     // progress.report({ increment: 50, message: "I am long running! - almost there..." });
        //     progress.report({ message: "I am long running! - almost there..." });
        // }, 3000);

        // return 'done';
        var p = new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 5000);
        });

        return p;
    });
    return 'now';
}


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