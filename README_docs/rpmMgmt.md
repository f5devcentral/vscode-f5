


# ATC ILX RPM MANAGEMENT

[BACK TO MAIN README](../README.md)

---

The extension can install and un-install ILX rpms on the connected device

## Commands

* `F5: Install/Update RPM`: Installs selected ATC and version
    - Updating an existing rpm to a newer version "should" work but hasn't been thoroughly tested
    - Provides a list of ATC tools to install (FAST, AS3, DO, TS)
        - When ATC service has been selected, a list of available version is presented
        - When a version is selected, the extension will check the local cache
            - if already downloaded, upload and install
            - if NOT already downloaded, then download from repo, upload to device, install
    - Also exposed as a right-click option in the explorer view
        - This allows the selection of local ILX RPMs that may be part of a repo

* `F5: Un-Install RPM`: Un-Installs selected rpm
    - Querys the device for currently installed rpm packages
    - On select, issues task to delete rpm install
    

>**Note:  the install/un-install task completes rather quickly but it can take another 20-60 seconds for restnoded/restjavad to complete the restart**


