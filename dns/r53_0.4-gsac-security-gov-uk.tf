resource "aws_route53_record" "gsac-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "gsac"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-707.awsdns-24.net.",
    "ns-1756.awsdns-27.co.uk.",
    "ns-1331.awsdns-38.org.",
    "ns-273.awsdns-34.com.",
  ]
}
