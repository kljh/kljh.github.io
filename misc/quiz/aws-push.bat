@echo off

set func=quiz
set func=quiz_next

: zip
7z a quiz.zip index.js quiz-app.js quiz-db.js quiz-questions.json

: push to aws

:: aws lambda list-functions
aws lambda update-function-code --function-name %func% --zip-file fileb://quiz.zip

: test
curl https://pe3j46jvbh.execute-api.eu-west-3.amazonaws.com/default/add_two_numbers?a=3&b=5&a=72
curl https://pe3j46jvbh.execute-api.eu-west-3.amazonaws.com/default/quiz?action=questions
