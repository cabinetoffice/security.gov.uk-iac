resource "aws_route53_record" "cluster2securitysupport-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "cluster2securitysupport"
  ttl             = local.low_ttl
  type            = "NS"

  records = [
    "ns-301.awsdns-37.com.",
    "ns-1846.awsdns-38.co.uk.",
    "ns-817.awsdns-38.net.",
    "ns-1281.awsdns-32.org.",
  ]
}
