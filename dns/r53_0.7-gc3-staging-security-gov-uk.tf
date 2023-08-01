resource "aws_route53_record" "gc3-staging-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "gc3-staging"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-278.awsdns-34.com.",
    "ns-1197.awsdns-21.org.",
    "ns-666.awsdns-19.net.",
    "ns-1586.awsdns-06.co.uk."
  ]
}

#resource "aws_route53_record" "gccc-ds" {
#  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
#  allow_overwrite = true
#  name            = "gccc"
#  ttl             = local.standard_ttl
#  type            = "DS"

#  records = [
#    "16448 13 2 xxx"
#  ]
#}
