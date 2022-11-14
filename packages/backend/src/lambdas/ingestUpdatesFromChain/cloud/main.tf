variable "environment" {
  description = "Deploy environment. One of dev, staging or prod"
  type        = string
  default     = "dev"
}

variable "application_data_table_arn" {
  type = string
}

resource "aws_lambda_function" "ingest-updates-from-chain" {
  function_name = "ingest-updates-from-chain"
  role          = aws_iam_role.ingest-updates-from-chain.arn

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.snapshot-votes.bucket
    }
  }

  lifecycle {
    ignore_changes = [handler, runtime, tags, publish, memory_size, timeout]
  }
}

resource "aws_secretsmanager_secret" "alchemy-api-key" {
  name = "mainnet-alchemy-api-key"
}

resource "aws_iam_role" "ingest-updates-from-chain" {
  name = "IngestUpdatesFromChainExecutionRole"

  assume_role_policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Action" : "sts:AssumeRole",
          "Principal" : {
            "Service" : "lambda.amazonaws.com"
          },
          "Effect" : "Allow",
          "Sid" : ""
        }
      ]
    }
  )
}

resource "aws_iam_role_policy" "ingest-updates-from-chain" {
  name = "IngestUpdatesFromChainExecutionPolicy"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        Sid = "AccessS3",
        "Effect" : "Allow",
        "Action" : [
          "s3:PutObject",
          "s3:GetObject",
        ],
        "Resource" : [
          aws_s3_bucket.snapshot-votes.arn,
          "${aws_s3_bucket.snapshot-votes.arn}/*",
        ]
      },
      {
        Sid    = "AccessDynamo",
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:TransactWriteItems",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
        ],
        Resource = [
          var.application_data_table_arn,
          "${var.application_data_table_arn}/*"
        ]
      },
      {
        Sid    = "AccessSecrets",
        Effect = "Allow",
        Action = "secretsmanager:GetSecretValue",
        Resource = [
          aws_secretsmanager_secret.alchemy-api-key.arn,
        ]
      },
    ]
  })

  role = aws_iam_role.ingest-updates-from-chain.id
}

resource "aws_s3_bucket" "snapshot-votes" {
  bucket = "agora-${var.environment}-snapshot"
}
