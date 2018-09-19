// entry point for AWS Lambda

const app = require('./quiz-app');

app.load_questions_from_file();
exports.handler = app.quiz_aws_handler;