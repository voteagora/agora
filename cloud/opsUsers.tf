resource "aws_iam_user" "engineering-operations" {
  name = "engineering-operations"
}

resource "aws_iam_user_policy_attachment" "engineering-operations-read-only" {
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
  user       = aws_iam_user.engineering-operations.name
}

# A user for admin operations. This is the break glass account.
resource "aws_iam_user" "admin-operations" {
  name = "admin-operations"
}

resource "aws_iam_user_policy_attachment" "engineering-admin" {
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
  user       = aws_iam_user.admin-operations.name
}

resource "aws_iam_openid_connect_provider" "default" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = []
}

resource "aws_iam_role" "github-action" {
  assume_role_policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Effect" : "Allow",
          "Principal" : {
            "Federated" : aws_iam_openid_connect_provider.default.arn,
          },
          "Action" : "sts:AssumeRoleWithWebIdentity",
          "Condition" : {
            "StringLike" : {
              "token.actions.githubusercontent.com:sub" : "repo:0xcaff/nouns-agora:*"
            },
            "ForAllValues:StringEquals" : {
              "token.actions.githubusercontent.com:iss" : "https://token.actions.githubusercontent.com",
              "token.actions.githubusercontent.com:aud" : "sts.amazonaws.com"
            }
          }
        }
      ]
    }
  )

  # TODO: scope this down more
  managed_policy_arns = ["arn:aws:iam::aws:policy/AdministratorAccess"]
}
