@echo off

set func=quiz
set func=quiz_next

goto :deploy
goto :test
goto :eof

:deploy

7z a quiz.zip index.js quiz-app.js quiz-db.js quiz-questions.json

:: aws lambda list-functions
call aws lambda update-function-code --function-name %func% --zip-file fileb://quiz.zip

del quiz.zip
echo.

:test

set srv=https://pe3j46jvbh.execute-api.eu-west-3.amazonaws.com/default
set srv=http://localhost:8080

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

::pause