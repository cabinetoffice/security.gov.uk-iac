resource "aws_route53_record" "vuln-report-nonprod-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "vulnerability-reporting.nonprod-service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-1202.awsdns-22.org.",
    "ns-527.awsdns-01.net.",
    "ns-243.awsdns-30.com.",
    "ns-1927.awsdns-48.co.uk.",
  ]
}

resource "aws_route53_record" "sso-nonprod-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "sso.nonprod-service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-897.awsdns-48.net.",
    "ns-1098.awsdns-09.org.",
    "ns-363.awsdns-45.com.",
    "ns-1805.awsdns-33.co.uk.",
  ]
}

resource "aws_route53_record" "webcaf-nonprod-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "webcaf.nonprod-service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "nns-397.awsdns-49.com.",
    "ns-2005.awsdns-58.co.uk.",
    "ns-1490.awsdns-58.org.",
    "ns-671.awsdns-19.net.",
  ]
}


	
