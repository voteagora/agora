resource "aws_dynamodb_table" "application_data_table" {
  name         = "ApplicationData"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PartitionKey"
  range_key    = "SortKey"

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

resource "aws_dynamodb_table_item" "acquire-ingest-updates-lock" {
  table_name = aws_dynamodb_table.application_data_table.name
  hash_key   = aws_dynamodb_table.application_data_table.hash_key
  range_key  = aws_dynamodb_table.application_data_table.range_key
  lifecycle {
    ignore_changes = [
      # Value stored at key will change. This value should only be set during
      # initial provisioning.
      item
    ]
  }

  item = <<-ITEM
    {
      "PartitionKey": { "S": "AcquireIngestUpdatesLock" },
      "SortKey": { "S": "fixed" },
      "lockHolder": { "S": "UNLOCKED" }
    }
  ITEM
}
