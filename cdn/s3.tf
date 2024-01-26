resource "aws_s3_bucket" "cdn_source_bucket" {
  bucket = local.s3_bucket_name

  tags = { "Name" : local.s3_bucket_name }
}

resource "aws_cloudfront_origin_access_identity" "cdn_source_bucket" {
  comment = local.primary_domain
}

data "aws_iam_policy_document" "cdn_source_bucket_policy" {
  statement {
    actions = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      "${aws_s3_bucket.cdn_source_bucket.arn}/*",
      aws_s3_bucket.cdn_source_bucket.arn
    ]

    principals {
      type = "AWS"
      identifiers = [
        aws_cloudfront_origin_access_identity.cdn_source_bucket.iam_arn
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "cdn_source_bucket" {
  bucket = aws_s3_bucket.cdn_source_bucket.id
  policy = data.aws_iam_policy_document.cdn_source_bucket_policy.json
}

locals {
  current_time = timestamp()
  three_months = timeadd(local.current_time, "2160h")
}

# === CDN Logging ===

data "aws_canonical_user_id" "current" {}
data "aws_cloudfront_log_delivery_canonical_user_id" "cfuid" {}

resource "aws_s3_bucket" "cdn_logging" {
  bucket = "${local.primary_domain}-cloudfront-logging"
  tags   = { "Name" : "${local.primary_domain}-cloudfront-logging" }
}

resource "aws_s3_bucket_ownership_controls" "cdn_logging" {
  bucket = aws_s3_bucket.cdn_logging.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "cdn_logging" {
  bucket = aws_s3_bucket.cdn_logging.id

  access_control_policy {
    owner {
      id = data.aws_canonical_user_id.current.id
    }

    grant {
      grantee {
        id   = data.aws_cloudfront_log_delivery_canonical_user_id.cfuid.id
        type = "CanonicalUser"
      }
      permission = "FULL_CONTROL"
    }

    grant {
      grantee {
        id   = data.aws_canonical_user_id.current.id
        type = "CanonicalUser"
      }
      permission = "FULL_CONTROL"
    }
  }
}
