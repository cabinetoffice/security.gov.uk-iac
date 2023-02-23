resource "null_resource" "build_api_lambda" {
  count    = var.IS_CI ? 0 : 1
  triggers = {
    content_md_hash = sha256(file("../../security.gov.uk-content/build/content_metadata.json"))
    app_js_hash = sha256(file("lambda-api/app.js"))
    lambda_js_hash = sha256(file("lambda-api/lambda.js"))
    package_json_hash = sha256(file("lambda-api/package.json"))
  }
  provisioner "local-exec" {
    command = "lambda-api/build-lambda-api.sh"
  }
}

data "archive_file" "api_lambda_zip" {
  depends_on = [null_resource.build_api_lambda]

  type = "zip"

  source_dir  = "lambda-api-build"
  output_path = "lambda-api.zip"
}

resource "aws_lambda_function_url" "api_lambda" {
  function_name      = aws_lambda_function.api_lambda.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_function" "api_lambda" {
  filename         = data.archive_file.api_lambda_zip.output_path
  source_code_hash = data.archive_file.api_lambda_zip.output_base64sha256

  description      = "${terraform.workspace}: Lambda Viewer Request for CloudFront"
  function_name    = local.api_lambda_name
  role             = aws_iam_role.api_lambda_role.arn
  handler          = "lambda.handler"
  runtime          = "nodejs16.x"

  memory_size = 256
  timeout     = 15
  publish     = true

  lifecycle {
    ignore_changes = [
      last_modified,
      environment
    ]
  }

  depends_on = [
    aws_iam_role_policy_attachment.api_lambda_pa,
    aws_cloudwatch_log_group.api_lambda_lg,
  ]
}

resource "aws_iam_role" "api_lambda_role" {
  name               = local.api_iam_role
  assume_role_policy = data.aws_iam_policy_document.api_arpd.json
}

resource "aws_cloudwatch_log_group" "api_lambda_lg" {
  name              = "/aws/lambda/${local.api_lambda_name}"
  retention_in_days = 14
}

resource "aws_kms_key" "lambda_api_env_vars" {
  description              = "${terraform.workspace}: lambda-api-env-vars"
  customer_master_key_spec = "SYMMETRIC_DEFAULT"
  key_usage                = "ENCRYPT_DECRYPT"
}

# See also the following AWS managed policy: AWSLambdaBasicExecutionRole
resource "aws_iam_policy" "api_lambda_policy" {
  name        = local.api_iam_policy
  path        = "/"
  description = "IAM policy for logging from a lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*",
        Effect = "Allow"
      },
      {
        Effect = "Allow"
        Action = [ "kms:Decrypt" ]
        Resource = aws_kms_key.lambda_api_env_vars.arn
        Condition = {
          StringEquals = {
            "kms:EncryptionContext:LambdaFunctionName" = "${local.api_lambda_name}"
          }
        }
      },
      {
        Action = [ "s3:GetObject" ],
        Resource = "${aws_s3_bucket.cdn_source_bucket.arn}/*"
        Effect = "Allow"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_lambda_pa" {
  role       = aws_iam_role.api_lambda_role.name
  policy_arn = aws_iam_policy.api_lambda_policy.arn
}

data "aws_iam_policy_document" "api_arpd" {
  statement {
    sid    = "AllowAwsToAssumeRole"
    effect = "Allow"

    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"

      identifiers = [
        "lambda.amazonaws.com",
      ]
    }
  }
}
