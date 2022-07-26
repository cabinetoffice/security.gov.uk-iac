locals {
  nonprod_domain = "nonprod.security.gov.uk"
  nonprod_tags = {
    "Service" : "security.gov.uk",
    "Reference" : "https://github.com/cabinetoffice/security.gov.uk-iac",
    "Environment" : "nonprod"
  }
}

resource "aws_route53_zone" "np-sec-gov-uk" {
  name = local.nonprod_domain

  tags = merge(
    { "Name" : local.nonprod_domain },
    local.nonprod_tags
  )
}

data "aws_cloudfront_distribution" "nonprod-cdn" {
  id = "..."
}

resource "aws_route53_record" "a" {
  zone_id = aws_route53_zone.np-sec-gov-uk.zone_id
  name    = ""
  type    = "A"

  alias {
    name                   = data.aws_cloudfront_distribution.nonprod-cdn.domain_name
    zone_id                = data.aws_cloudfront_distribution.nonprod-cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "aaaa" {
  zone_id = aws_route53_zone.np-sec-gov-uk.zone_id
  name    = ""
  type    = "AAAA"

  alias {
    name                   = data.aws_cloudfront_distribution.nonprod-cdn.domain_name
    zone_id                = data.aws_cloudfront_distribution.nonprod-cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www-a" {
  zone_id = aws_route53_zone.np-sec-gov-uk.zone_id
  name    = "www"
  type    = "A"

  alias {
    name                   = data.aws_cloudfront_distribution.nonprod-cdn.domain_name
    zone_id                = data.aws_cloudfront_distribution.nonprod-cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www-aaaa" {
  zone_id = aws_route53_zone.np-sec-gov-uk.zone_id
  name    = "www"
  type    = "AAAA"

  alias {
    name                   = data.aws_cloudfront_distribution.nonprod-cdn.domain_name
    zone_id                = data.aws_cloudfront_distribution.nonprod-cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "security_txt" {
  zone_id = aws_route53_zone.np-sec-gov-uk.zone_id
  name    = "_security"
  type    = "TXT"
  ttl     = 1800

  records = [
    "security_policy=https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt",
    "security_contact=https://vulnerability-reporting.service.security.gov.uk/submit",
    "security_contact=mailto:vulnerability-reporting@cabinetoffice.gov.uk"
  ]
}

module "np-aws-r53-parked-domain" {
  source                 = "github.com/co-cddo/aws-route53-parked-govuk-domain//terraform?ref=5e85556ce417cd335c440fd1e7079bd331f443d5"
  zone_id                = aws_route53_zone.np-sec-gov-uk.zone_id
  depends_on             = [aws_route53_zone.np-sec-gov-uk]
  email_records          = true  # default
  webserver_records      = false # default
  additional_txt_records = [
    "google-site-verification=...",
    "security_policy=https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt"
  ]
}
