resource "aws_route53_record" "gscpp-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "gscpp"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-676.awsdns-20.net.",
    "ns-2022.awsdns-60.co.uk.",
    "ns-32.awsdns-04.com.",
    "ns-1359.awsdns-41.org.",
  ]
}
