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

resource "aws_iam_user" "cloudflare-execution" {
  name = "cloudflare-execution"
}
