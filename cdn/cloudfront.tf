# == caching policies ==

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_cache_policy" "caching_enabled" {
  name = "Managed-CachingOptimized"
}

# == origin request policies ==

data "aws_cloudfront_origin_request_policy" "all" {
  name = "Managed-AllViewer"
}

data "aws_cloudfront_origin_request_policy" "s3_for_caching" {
  name = "Managed-CORS-S3Origin"
}

resource "aws_cloudfront_origin_request_policy" "custom_lae_s3_origin" {
  name    = "Custom-Lambda-at-Edge-S3-Origin-${terraform.workspace}"
  comment = ""

  cookies_config {
    cookie_behavior = "whitelist"
    cookies {
      items = [
        "__Host-Session-SGUK",
        "__host-session-sguk",
        "__Host-SGUK-Redirect",
        "__host-sguk-redirect"
      ]
    }
  }
  headers_config {
    header_behavior = "whitelist"
    headers {
      items = [
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "X-Forwarded-For",
        "true-client-ip",
        "true-user-agent",
        "true-host"
      ]
    }
  }
  query_strings_config {
    query_string_behavior = "whitelist"
    query_strings {
      items = ["t", "p", "action", "secret", "organisation", "signature"]
    }
  }
}

resource "aws_cloudfront_origin_request_policy" "api_origin" {
  name    = "Custom-API-Origin-${terraform.workspace}"
  comment = ""

  cookies_config {
    cookie_behavior = "whitelist"
    cookies {
      items = [
        "__Host-Session-SGUK",
        "__host-session-sguk",
        "__Host-SGUK-Redirect",
        "__host-sguk-redirect"
      ]
    }
  }
  headers_config {
    header_behavior = "whitelist"
    headers {
      items = [
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "X-Forwarded-For",
        "true-client-ip",
        "true-user-agent",
        "true-host"
      ]
    }
  }
  query_strings_config {
    query_string_behavior = "all"
  }
}

# == functions ==

// API viewer request to set the "true-client-ip" and "true-host" headers
resource "aws_cloudfront_function" "viewer_request" {
  name    = "viewer-request-${terraform.workspace}"
  runtime = "cloudfront-js-1.0"
  comment = "viewer-request-${terraform.workspace}"
  publish = true
  code    = file("function-viewer-request/index.js")
}

// all viewer responses to set the security headers
resource "aws_cloudfront_function" "viewer_response" {
  name    = "viewer-response-${terraform.workspace}"
  runtime = "cloudfront-js-1.0"
  comment = "viewer-response-${terraform.workspace}"
  publish = true
  code    = file("function-viewer-response/index.js")
}

resource "random_password" "signing_secret" {
  length  = 32
  special = false
}

# == distribution ==

resource "aws_cloudfront_distribution" "cdn" {
  depends_on = [aws_acm_certificate.cdn]

  origin {
    domain_name = aws_s3_bucket.cdn_source_bucket.bucket_regional_domain_name
    origin_id   = local.s3_origin_id

    custom_header {
      name  = "x-signing-secret"
      value = random_password.signing_secret.result
    }

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.cdn_source_bucket.cloudfront_access_identity_path
    }
  }

  origin {
    domain_name = split("/", aws_lambda_function_url.api_lambda.function_url)[2]
    origin_id   = local.api_origin_id

    custom_origin_config {
      http_port  = "80"
      https_port = "443"

      origin_ssl_protocols   = ["TLSv1.2"]
      origin_protocol_policy = "https-only"
    }
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cdn_logging.bucket_domain_name
    prefix          = terraform.workspace
  }

  http_version    = "http2and3"
  enabled         = true
  is_ipv6_enabled = true
  comment         = local.primary_domain

  aliases = [local.primary_domain, "www.${local.primary_domain}"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.custom_lae_s3_origin.id
    compress                 = false
    viewer_protocol_policy   = "redirect-to-https"

    lambda_function_association {
      event_type = "origin-request"
      lambda_arn = aws_lambda_function.origin_request_lambda.qualified_arn
    }

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.viewer_response.arn
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.viewer_request.arn
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_origin_id

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_enabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.s3_for_caching.id
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.viewer_response.arn
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/sitemap.txt"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_origin_id

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_enabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.s3_for_caching.id
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.viewer_response.arn
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    cached_methods   = ["HEAD", "GET"]
    target_origin_id = local.api_origin_id

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.api_origin.id
    compress                 = false
    viewer_protocol_policy   = "redirect-to-https"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.viewer_request.arn
    }

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.viewer_response.arn
    }
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = { "Name" : local.primary_domain }

  viewer_certificate {
    cloudfront_default_certificate = false
    acm_certificate_arn            = aws_acm_certificate.cdn.arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}
