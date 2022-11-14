variable "environment" {
  description = "Deploy environment. One of dev, staging or prod"
  type        = string
  default     = "dev"
}

variable "application_data_table_arn" {
  type = string
}

resource "aws_ssm_parameter" "s3-bucket" {
  name  = "/loadSnapshotVotes/s3Bucket"
  type  = "String"
  value = aws_s3_bucket.snapshot-votes.bucket
}


resource "aws_s3_bucket" "snapshot-votes" {
  bucket = "agora-${var.environment}-snapshot-votes-load"
}

resource "aws_iam_role" "fetch-snapshot-execution-role" {
  name = "FetchSnapshotExecutionRole"

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

  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]
}

resource "aws_iam_role_policy" "fetch-snapshot-execution-policy" {
  name = "FetchSnapshotExecutionPolicy"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        Sid = "AccessS3",
        "Effect" : "Allow",
        "Action" : [
          "s3:*",
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
          "dynamodb:BatchWriteItem"
        ],
        Resource = [
          var.application_data_table_arn,
          "${var.application_data_table_arn}/*"
        ]
      }
    ]
  })

  role = aws_iam_role.fetch-snapshot-execution-role.id
}
