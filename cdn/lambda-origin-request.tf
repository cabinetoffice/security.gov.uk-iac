data "archive_file" "origin_request_lambda_zip" {
  type = "zip"

  source_dir  = "lambda-origin-request-build"
  output_path = "lambda-origin-request.zip"
}

resource "aws_lambda_function" "origin_request_lambda" {
  provider = aws.us_east_1

  filename         = data.archive_file.origin_request_lambda_zip.output_path
  source_code_hash = data.archive_file.origin_request_lambda_zip.output_base64sha256

  description      = "${terraform.workspace}: Lambda Origin Request for CloudFront"
  function_name    = local.origin_request_lambda_name
  role             = aws_iam_role.origin_request_lambda_role.arn
  handler          = "router.wrap_handler"
  runtime          = "nodejs16.x"

  publish = true

  lifecycle {
    ignore_changes = [
      last_modified,
    ]
  }

  depends_on = [
    aws_iam_role_policy_attachment.origin_request_lambda_pa,
    aws_cloudwatch_log_group.origin_request_lambda_lg,
  ]
}

resource "aws_iam_role" "origin_request_lambda_role" {
  name               = local.origin_request_iam_role
  assume_role_policy = data.aws_iam_policy_document.origin_request_arpd.json
}

resource "aws_cloudwatch_log_group" "origin_request_lambda_lg" {
  name              = "/aws/lambda/us-east-1.${local.origin_request_lambda_name}"
  retention_in_days = 14
}

# See also the following AWS managed policy: AWSLambdaBasicExecutionRole
resource "aws_iam_policy" "origin_request_lambda_policy" {
  name        = local.origin_request_iam_policy
  path        = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "origin_request_lambda_pa" {
  role       = aws_iam_role.origin_request_lambda_role.name
  policy_arn = aws_iam_policy.origin_request_lambda_policy.arn
}

data "aws_iam_policy_document" "origin_request_arpd" {
  statement {
    sid    = "AllowAwsToAssumeRole"
    effect = "Allow"

    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"

      identifiers = [
        "edgelambda.amazonaws.com",
        "lambda.amazonaws.com",
      ]
    }
  }
}
