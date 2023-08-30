resource "aws_route53_record" "gc3-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "gc3"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-1093.awsdns-08.org.",
    "ns-556.awsdns-05.net.",
    "ns-339.awsdns-42.com.",
    "ns-1943.awsdns-50.co.uk."
  ]
}


resource "aws_route53_record" "gc3-ds" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "gc3"
  ttl             = local.standard_ttl
  type            = "DS"

  records = [
    "40425 13 2 B2E93D0CB4E0F345B0580AAEC8CE6825144A813FCB539C483C82B9F747F4CC5B"
  ]
}
