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

#resource "aws_route53_record" "gccc-ds" {
#  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
#  allow_overwrite = true
#  name            = "gc3"
#  ttl             = local.standard_ttl
#  type            = "DS"

#  records = [
#    "16448 13 2 xxx"
#  ]
#}
