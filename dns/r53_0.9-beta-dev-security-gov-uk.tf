resource "aws_route53_record" "beta-dev-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "beta-dev"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-525.awsdns-01.net.",
    "ns-337.awsdns-42.com.",
    "ns-1266.awsdns-30.org.",
    "ns-1573.awsdns-04.co.uk."
  ]
}


resource "aws_route53_record" "beta-dev-ds" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "beta-dev"
  ttl             = local.standard_ttl
  type            = "DS"

  records = [
    "17728 13 2 7FF2AE74B585888998FC9ABD27ADE0ED535726A7A6CEB168229A13DADBCEA559"
  ]
}
