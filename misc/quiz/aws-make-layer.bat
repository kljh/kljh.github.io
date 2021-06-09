@echo off

@set PATH=C:\Program Files\7-Zip;%PATH%

:: call :make_layer sharp
:: call :make_layer aws-sdk
:: call :make_layer pdfkit
:: call :make_layer diff
:: call :make_layer nodemailer
:: call :make_layer crypto
:: call :make_layer request
:: call :make_layer request-promise
:: call :make_layer exif-js

goto :eof

:make_layer

echo Building AWS layer %1

mkdir %1
cd %1

mkdir nodejs
cd nodejs

call npm init -y
call npm install --arch=x64 --platform=linux %1

cd ..

:: zip -9r aws-layer-%1.zip nodejs
7z a aws-layer-%1.zip nodejs

aws s3 cp aws-layer-%1.zip s3://kljhapp/aws-layers/aws-layer-%1.zip

cd ..

echo --- 
goto :eof
