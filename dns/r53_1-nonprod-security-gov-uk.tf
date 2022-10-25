resource "aws_route53_zone" "np-sec-gov-uk" {
  name = local.nonprod_domain

  tags = merge(local.default_tags, {
    "Name" : local.nonprod_domain,
    "Environment": "nonprod"
  })

  lifecycle {
    ignore_changes = [tags]
  }
}

data "aws_cloudfront_distribution" "nonprod-cdn" {
  id = "E2LOQ41XTODRB2"
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
  ttl     = local.standard_ttl

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
    "google-site-verification=3EQRZEbgFr5cq9w3guznHUPnU_S7MQyDsQ_CuVCSpEM",
    "security_policy=https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt"
  ]
}
