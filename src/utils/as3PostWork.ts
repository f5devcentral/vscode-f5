   /**
     * Post AS3 Dec
     * @param device BIG-IP/Host/Device in <user>&#64;<host/ip> format
     * @param password User Password
     * @param dec Delcaration
     * @returns object
     */
    async postAS3Dec(device: string, password: string, dec: object, param: string = '') {
        var [username, host] = device.split('@');

        // const tokenA = getAuthToken(host, username, password);
        // console.log(`NEW TOKEN:  ${tokenA}`);
        

        return getAuthToken(host, username, password)
            .then( token => {
                // const host = host;
                // const token = token.token;
                
                // make initial dec post
                // vscode.window.withProgress({
                //     "location": vscode.ProgressLocation.Notification,
                //     "title": "POSTING!!!",
                //     cancellable: true
                // }, (progress, token) => {
                //     token.onCancellationRequested(() => {
                //         console.log("User canceled the long running operation");
                //         progress.report({ increment: 0 });
                //     });

                // });
                return callHTTP(
                    'POST', 
                    host, 
                    `/mgmt/shared/appsvcs/declare?${param}`, 
                    token,
                    dec
                )
                .then(async response => {

                    let taskId: string | undefined;
                    if(response.status === 202) {
                        taskId = response.body.id;
                        console.log(`as3 async post: id:${taskId}`);

                        console.log(`first time out 3000`);
                        
                        
                        let postResults: string = 'in progress';
                        let loopStatus: string | undefined;
                        do {
                            console.log(`callin apis!`);
                            setTimeout( () => {
                                response = callHTTP(
                                    'GET',
                                    host,
                                    `/mgmt/shared/appsvcs/task/${taskId}`,
                                    token,
                                    );
                                    
                                    if(response.body.results) {
                                        console.log(`RESULTS: ${response.body.results[0].message}`);
                                        postResults = response.body.results[0].message;
                                        if (postResults === 'in progress') {
                                            // setTimeout(() => {
                                            //     console.log(`while timeout 3000`);
                                                
                                            // }, 3000);
                                        }
                                    }
                                    debugger;
                                    
                                    
                            },300);
                        }
                        while ( response.status !== 200 && taskId && postResults === 'in progress');
                    }


                    // if(response.status === 200) {
                        // debugger;
                    //     return response;
                    // } else {
                        return response;
                    // }
                });
            }
        );
    }
};