resource "aws_route53_record" "vuln-report-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "vulnerability-reporting.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-557.awsdns-05.net.",
    "ns-150.awsdns-18.com.",
    "ns-1263.awsdns-29.org.",
    "ns-1925.awsdns-48.co.uk.",
  ]
}

resource "aws_route53_record" "vuln-scan-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "vulnerability-scanning.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-1505.awsdns-60.org.",
    "ns-1738.awsdns-25.co.uk.",
    "ns-862.awsdns-43.net.",
    "ns-434.awsdns-54.com.",
  ]
}

resource "aws_route53_record" "sso-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "sso.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-1503.awsdns-59.org.",
    "ns-380.awsdns-47.com.",
    "ns-1778.awsdns-30.co.uk.",
    "ns-958.awsdns-55.net.",
  ]
}
