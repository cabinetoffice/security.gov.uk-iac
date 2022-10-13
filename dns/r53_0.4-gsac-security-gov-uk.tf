resource "aws_route53_record" "gsac-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "gsac"
  ttl             = 3600
  type            = "NS"

  records = [
    "ns1.p08.dynect.net.",
    "ns2.p08.dynect.net.",
    "ns3.p08.dynect.net.",
    "ns4.p08.dynect.net.",
  ]
}
