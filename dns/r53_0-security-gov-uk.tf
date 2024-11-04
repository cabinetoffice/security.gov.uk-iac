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
    name                   = "dva8rm30cjiak.cloudfront.net."
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www-a-prod" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "www"
  type    = "A"

  alias {
    name                   = "dva8rm30cjiak.cloudfront.net."
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "aaaa-prod" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = ""
  type    = "AAAA"

  alias {
    name                   = "dva8rm30cjiak.cloudfront.net."
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www-aaaa-prod" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "www"
  type    = "AAAA"

  alias {
    name                   = "dva8rm30cjiak.cloudfront.net."
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "root-digicert" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "_ldkg6g77ndrtxe76u7fl11r1t1u6jms.security.gov.uk."
  type    = "CNAME"
  ttl     = local.extra_low_ttl

  records = [
    "dcv.digicert.com."
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

resource "aws_route53_record" "root-acm-cert-beta" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "_b12eda99a4cee1338f2cf718c65d76df.security.gov.uk."
  type    = "CNAME"
  ttl     = local.extra_low_ttl

  records = [
    "_687546ef2b147181f752a60af5c807c3.mhbtsbpdnt.acm-validations.aws."
  ]
}

resource "aws_route53_record" "www-acm-cert-beta" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "_ae8ab51d93bfe23d219cf6a3071ecd92.www.security.gov.uk."
  type    = "CNAME"
  ttl     = local.extra_low_ttl

  records = [
    "_aacff1a68823ff2fe94689cd78fc2fa8.mhbtsbpdnt.acm-validations.aws."
  ]
}

resource "aws_route53_record" "security_txt-prod" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "_security"
  type    = "TXT"
  ttl     = local.standard_ttl

  records = [
    "security_policy=https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt",
    "security_contact=https://vulnerability-reporting.service.security.gov.uk/submit",
  ]
}

resource "aws_route53_record" "myncsc-prod" {
  zone_id = aws_route53_zone.sec-gov-uk.zone_id
  name    = "_asvdns-b216d260-ad66-4361-b03a-5e4d33030e96"
  type    = "TXT"
  ttl     = local.standard_ttl

  records = [
    "asvdns_89aec9a2-b17e-4fd2-864e-ad9918dcd459",
  ]
}

module "aws-r53-parked-domain" {
  source                 = "github.com/co-cddo/aws-route53-parked-govuk-domain//terraform?ref=5e85556ce417cd335c440fd1e7079bd331f443d5"
  zone_id                = aws_route53_zone.sec-gov-uk.zone_id
  depends_on             = [aws_route53_zone.sec-gov-uk]
  email_records          = true  # default
  webserver_records      = false # default
  additional_txt_records = [
    "google-site-verification=F0j1biFiYCVlsBKGjA7GxztPNHF2Z3qSJRPMIq1U-jo",
    "security_policy=https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt",
    "postman-domain-verification=02fd4f7a688d10eadedea552973d23578fe149fd58df8e081bb28f1371620a75d989fa3707f93a19e1a46a7d93ec502d4a9a07b9514f3fd156f1704b06ffcb28"
  ]
}
