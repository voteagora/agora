resource "aws_iam_user" "cloudflare-execution" {
  name = "cloudflare-execution"
}

resource "aws_iam_user_policy" "workers-execution-policy" {
  name = "CloudflareWorkersExecutionPolicy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:TransactWriteItems",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
        ],
        Resource = [
          aws_dynamodb_table.application_data_table.arn,
          "${aws_dynamodb_table.application_data_table.arn}/*"
        ]
      }
    ]
  })
  user = aws_iam_user.cloudflare-execution.name
}

