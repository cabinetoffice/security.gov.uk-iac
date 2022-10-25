resource "aws_route53_zone" "sec-gov-uk" {
  name = local.domain

  tags = merge(local.default_tags, {
    "Name" : local.domain,
    "Environment" : "prod"
  })
  
  lifecycle {
    ignore_changes = [tags]
  }
}

resource "aws_route53_record" "a-prod" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = ""
  type    = "A"

  alias {
    name                   = "d2loim61rklw4t.cloudfront.net."
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www-cname-prod" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "www"
  type    = "CNAME"
  ttl     = local.extra_low_ttl

  records = [
    "d1hn3ymz0l9zrk.cloudfront.net"
  ]
}

resource "aws_route53_record" "root-acm-cert" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "_20b0a1cfae94ddd400d956a5289fb7d4"
  type    = "CNAME"
  ttl     = local.extra_low_ttl

  records = [
    "_d4071d469c94f773b7aa93f9bfdaa852.tjxrvlrcqj.acm-validations.aws."
  ]
}

resource "aws_route53_record" "www-acm-cert" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "_ecb1bd558ba274319d8d129b737d36e2.www"
  type    = "CNAME"
  ttl     = local.extra_low_ttl

  records = [
    "_b73153c9f2ed143e9e7d8efb7f4a263a.lkwmzfhcjn.acm-validations.aws."
  ]
}

#data "aws_cloudfront_distribution" "cdn-prod" {
#  id = "..."
#}

#resource "aws_route53_record" "a-prod" {
#  zone_id = aws_route53_zone.sec-gov-uk.zone_id
#  name    = ""
#  type    = "A"
#
#  alias {
#    name                   = data.aws_cloudfront_distribution.cdn-prod.domain_name
#    zone_id                = data.aws_cloudfront_distribution.cdn-prod.hosted_zone_id
#    evaluate_target_health = false
#  }
#}
#
#resource "aws_route53_record" "aaaa-prod" {
#  zone_id = aws_route53_zone.sec-gov-uk.zone_id
#  name    = ""
#  type    = "AAAA"
#
#  alias {
#    name                   = data.aws_cloudfront_distribution.cdn-prod.domain_name
#    zone_id                = data.aws_cloudfront_distribution.cdn-prod.hosted_zone_id
#    evaluate_target_health = false
#  }
#}
#
#resource "aws_route53_record" "www-a-prod" {
#  zone_id = aws_route53_zone.sec-gov-uk.zone_id
#  name    = "www"
#  type    = "A"
#
#  alias {
#    name                   = data.aws_cloudfront_distribution.cdn-prod.domain_name
#    zone_id                = data.aws_cloudfront_distribution.cdn-prod.hosted_zone_id
#    evaluate_target_health = false
#  }
#}
#
#resource "aws_route53_record" "www-aaaa-prod" {
#  zone_id = aws_route53_zone.sec-gov-uk.zone_id
#  name    = "www"
#  type    = "AAAA"
#
#  alias {
#    name                   = data.aws_cloudfront_distribution.cdn-prod.domain_name
#    zone_id                = data.aws_cloudfront_distribution.cdn-prod.hosted_zone_id
#    evaluate_target_health = false
#  }
#}

resource "aws_route53_record" "security_txt-prod" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "_security"
  type    = "TXT"
  ttl     = local.standard_ttl

  records = [
    "security_policy=https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt",
    "security_contact=https://vulnerability-reporting.service.security.gov.uk/submit",
    "security_contact=mailto:vulnerability-reporting@cabinetoffice.gov.uk"
  ]
}

module "aws-r53-parked-domain" {
  source                 = "github.com/co-cddo/aws-route53-parked-govuk-domain//terraform?ref=5e85556ce417cd335c440fd1e7079bd331f443d5"
  zone_id                = aws_route53_zone.sec-gov-uk.zone_id
  depends_on             = [aws_route53_zone.sec-gov-uk]
  email_records          = true  # default
  webserver_records      = false # default
  additional_txt_records = [
    "google-site-verification=...",
    "security_policy=https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt"
  ]
}
