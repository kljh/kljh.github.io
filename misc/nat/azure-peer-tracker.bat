@set app=kljh-peer-tracker
@set grp=%app%-res-grp
:: @set lang=node
:: @set dsk=%app:-=%
:: @set git=https://github.com/kljh/peer-tracker

::@call :create
@call :update
@goto :eof

:create

:: Create a resource group.
call az group create --location westeurope --name %grp%

:: Create an App Service plan in Free tier.
call az appservice plan create --name %app% --resource-group %grp% --sku FREE

:: Static content (HTML, CSS, and JavaScript files) for this tutorial is hosted in Blob Storage. Blob Storage requires a Storage account.
:: call az storage account create -n %dsk% -g %grp% --kind StorageV2 -l westeurope --https-only false --sku Standard_LRS
:: storage can be used to host static content

:: Create a web app.
call az webapp create --name %app% --resource-group %grp% --plan %app%
:: call az webapp deployment list-publishing-profiles --name %app% --resource-group %grp% --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output tsv
:: call az webapp deployment source config-local-git --name %app% --resource-group %grp% --query url --output tsv

:: Deploy code from a public GitHub repository (once or continuous)
:: call az webapp deployment source config --name %app% --resource-group %grp% --repo-url %git% --branch master --manual-integration
:: call az webapp deployment source config --name %app% --resource-group %grp% --repo-url %git% --branch master --git-token $token

::   --- or ---

:: Create a function app
::az functionapp create --resource-group %grp% --consumption-plan-location westeurope --name %app% --storage-account  %dsk% --runtime %lang%

@goto :eof

:update

:: call az webapp deployment list-publishing-profiles --name %app% --resource-group %grp% --query "[?contains(publishMethod, 'FTP')].[publishUrl,userName,userPWD]" --output tsv

set ftp-host=ftp://waws-prod-am2-229.ftp.azurewebsites.windows.net/site/wwwroot
set ftp-user=kljh-peer-tracker\$kljh-peer-tracker
set ftp-pass=byAoe1EkMZaB9rGTS1pcwvv0NpelF3G8gGpb7haCdoE4ySi5l7GKQg5SzLlc

curl -T index.html -u %ftp-user%:%ftp-pass% %ftp-host%/
curl -T web.config -u %ftp-user%:%ftp-pass% %ftp-host%/
curl -T server.js -u %ftp-user%:%ftp-pass% %ftp-host%/


:: Copy the result of the following command into a browser to see the web app.
@echo.
@echo http://%app%.azurewebsites.net
@echo http://%app%.azurewebsites.net/?id=toi

@goto :eof

:delete

:: Remove the resource group and all resources associated with it.
:: call az group delete --name myResourceGroup