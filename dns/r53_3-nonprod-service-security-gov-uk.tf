resource "aws_route53_record" "vuln-report-nonprod-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "vulnerability-reporting.nonprod-service"
  ttl             = 3600
  type            = "NS"

  records = [
    "ns-1202.awsdns-22.org.",
    "ns-527.awsdns-01.net.",
    "ns-243.awsdns-30.com.",
    "ns-1927.awsdns-48.co.uk.",
  ]
}
