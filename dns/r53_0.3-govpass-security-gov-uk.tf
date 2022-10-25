resource "aws_route53_record" "govpass-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "govpass"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-77.awsdns-09.com.",
    "ns-685.awsdns-21.net.",
    "ns-1118.awsdns-11.org.",
    "ns-1835.awsdns-37.co.uk.",
  ]
}
