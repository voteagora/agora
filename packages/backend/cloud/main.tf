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
  region  = "us-east-2"
}

resource "aws_dynamodb_table" "application_data_table" {
  name = "ApplicationData"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "PartitionKey"
  range_key = "SortKey"
  stream_enabled = true
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
