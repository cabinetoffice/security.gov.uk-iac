resource "aws_route53_record" "beta-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "beta"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-573.awsdns-07.net",
    "ns-1179.awsdns-19.org",
    "ns-1704.awsdns-21.co.uk",
    "ns-507.awsdns-63.com"
  ]
}


resource "aws_route53_record" "beta-ds" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "beta"
  ttl             = local.standard_ttl
  type            = "DS"

  records = [
    "17897 13 2 A44EE95238988F711063B4705BEFD8846E5E2411C52BDC8D02035E21964B152B"
  ]
}
