terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-2"
}

resource "aws_dynamodb_table" "application_data_table" {
  name             = "ApplicationData"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "PartitionKey"
  range_key        = "SortKey"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "PartitionKey"
    type = "S"
  }

  attribute {
    name = "SortKey"
    type = "S"
  }

  attribute {
    name = "SortKey__MergedDelegatesVotingPower"
    type = "S"
  }

  attribute {
    name = "SortKey__MergedDelegatesStatementHolders"
    type = "S"
  }

  attribute {
    name = "PartitionKey__MergedDelegatesVotingPower"
    type = "S"
  }

  attribute {
    name = "PartitionKey__MergedDelegatesStatementHolders"
    type = "S"
  }

  global_secondary_index {
    name            = "MergedDelegatesVotingPower"
    hash_key        = "PartitionKey__MergedDelegatesVotingPower"
    range_key       = "SortKey__MergedDelegatesVotingPower"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "MergedDelegatesStatementHolders"
    hash_key        = "PartitionKey__MergedDelegatesStatementHolders"
    range_key       = "SortKey__MergedDelegatesStatementHolders"
    projection_type = "ALL"
  }
}

resource "aws_s3_bucket" "snapshot-votes" {
  bucket = "agora-dev-snapshot-votes-load"
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
        "Effect" : "Allow",
        "Action" : [
          "s3:PutObject",
          "s3:GetObject",
        ],
        "Resource" : [
          aws_s3_bucket.snapshot-votes.arn,
          "${aws_s3_bucket.snapshot-votes.arn}/*",
        ]
      }
    ]
  })

  role = aws_iam_role.fetch-snapshot-execution-role.id
}

resource "aws_lambda_function" "fetch-snapshot" {
  function_name = "fetch-snapshot"
  role          = aws_iam_role.fetch-snapshot-execution-role.arn
  memory_size = 2048
  timeout = 300

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.snapshot-votes.bucket
    }
  }

  lifecycle {
    ignore_changes = [handler, runtime, tags, publish]
  }
}


# todo: hook up write half
# resource "aws_lambda_function" "application_mappings_trigger" {
#   function_name = ""
#   role          = ""
# }
#
# resource "aws_lambda_event_source_mapping" "example" {
#   event_source_arn  = aws_dynamodb_table.application_data_table.stream_arn
#   function_name     = aws_lambda_function.example.arn
#   starting_position = "LATEST"
# }
