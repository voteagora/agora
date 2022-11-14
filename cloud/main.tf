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

variable "deployment" {
  type    = string
  default = "ens"
}

variable "environment" {
  description = "Deploy environment. One of dev, staging or prod"
  type        = string
  default     = "dev"
}


module "ingestUpdatesFromChain" {
  source                     = "../packages/backend/src/lambdas/ingestUpdatesFromChain/cloud"
  application_data_table_arn = aws_dynamodb_table.application_data_table.arn
  environment                = var.environment
}

module "loadSnapshotVotes" {
  source                     = "../packages/backend/src/lambdas/loadSnapshotVotes/cloud"
  application_data_table_arn = aws_dynamodb_table.application_data_table.arn
  environment                = var.environment
}
