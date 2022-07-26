resource "aws_cloudfront_distribution" "cdn" {
  depends_on = [aws_acm_certificate.cdn]

  origin {
    domain_name = aws_s3_bucket.vrs_cdn_source_bucket.bucket_regional_domain_name
    origin_id   = local.origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.vrs_cdn_source_bucket.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = local.primary_domain
  default_root_object = "index.html"

  aliases = [local.primary_domain, "www.${local.primary_domain}"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.origin_id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.router.arn
    }

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 60
    max_ttl                = 3600
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
  }
}
