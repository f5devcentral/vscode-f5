# Project details

[BACK TO MAIN README](../README.md)

Name: f5-Fast
Desc:  




// functionality: configure tree view
	//	-- https://medium.com/@sanaajani/creating-your-first-vs-code-extension-8dbdef2d6ad9
	//	-- https://github.com/Microsoft/vscode-extension-samples/tree/master/tree-view-sample
	//	-- https://stackoverflow.com/search?q=%5Bvisual-studio-code%5D+TreeDataProvider
	//	-- https://stackoverflow.com/questions/56534723/simple-example-to-implement-vs-code-treedataprovider-with-json-data

	//	-- Example tree view for devices and details 
	// 		https://github.com/microsoft/vscode-cosmosdb
	// 		https://github.com/formulahendry/vscode-docker-explorer

	
	// command: execute bash/tmsh on device
	//	-- use device details from tree view, post api to bash endpoint, show response

	//	1.	move chuck joke to function in other file - DONE
	// 	2.	configure extension config to manage device list 
	//		2a.	settings structure to host devices - DONE
	//		2b.	command to quickly bring up settings - DONE
	//		2c.	quickPick list of hosts - just log what was selected - DONE
	//	3.	inputBox for passwords - DONE
	//	4.	keyring to store passwords
	//			- node-keytar - https://github.com/atom/node-keytar
	//	5.	tree view in F5 container
	//		4a.	F5 tree view contianer with f5 logo - DONE
	//		4b.	display hosts from config file in tree view - DONE
	//		4c. add/edit/delete device from tree view
	//	6.	configure tests?  mocha?
	//	7.	list fast templates under device in tree view
	//		6a.	when selected in tree view, display template in editor
	//	8.	list deployed applications in tree view
	//		7a.	when selected in tree view, display template in editor
	//	9.	configure JSON output highlighting like RestClient