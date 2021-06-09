@echo off

call :deploy
::goto :test

echo Done
::pause
goto :eof

:deploy

@set PATH=C:\Program Files\7-Zip;%PATH%

7z a quiz.zip index.js quiz-app.js quiz-db.js quiz-mail.js oauth.js quiz-questions.json

:: call aws lambda list-functions
call aws lambda update-function-configuration --function-name quiz --runtime nodejs14.x
call aws lambda update-function-code --function-name quiz --zip-file fileb://quiz.zip

del quiz.zip
echo.

goto :eof

:test

set srv=https://pe3j46jvbh.execute-api.eu-west-3.amazonaws.com/default
set srv=https://5nn8oaty7b.execute-api.eu-west-3.amazonaws.com/default
::set srv=http://localhost:8080

echo add_two_numbers
curl --silent "%srv%/add_two_numbers?a=13&b=15"
echo.
echo.

echo questions
curl --silent "%srv%/quiz?action=questions&pwd=Galilei"
echo.
echo.

echo users
curl --silent "%srv%/quiz?action=users&pwd=Galilei"
echo.
echo.

echo oauth
curl --silent "%srv%/quiz?action=oauth&state=linkedin"
echo.
echo.

echo invalid-action
curl --silent "%srv%/quiz?action=invalid-action"
echo.
echo.

goto :eof
