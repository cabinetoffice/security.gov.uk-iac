resource "aws_s3_bucket" "vrs_cdn_source_bucket" {
  bucket = local.primary_domain

  tags = { "Name" : local.primary_domain }
}

resource "aws_cloudfront_origin_access_identity" "vrs_cdn_source_bucket" {
  comment = local.primary_domain
}

data "aws_iam_policy_document" "vrs_cdn_source_bucket_policy" {
  statement {
    actions = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      "${aws_s3_bucket.vrs_cdn_source_bucket.arn}/*",
      aws_s3_bucket.vrs_cdn_source_bucket.arn
    ]

    principals {
      type = "AWS"
      identifiers = [
        aws_cloudfront_origin_access_identity.vrs_cdn_source_bucket.iam_arn
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "vrs_cdn_source_bucket" {
  bucket = aws_s3_bucket.vrs_cdn_source_bucket.id
  policy = data.aws_iam_policy_document.vrs_cdn_source_bucket_policy.json
}

locals {
  current_time = timestamp()
  three_months = timeadd(local.current_time, "2160h")
}
