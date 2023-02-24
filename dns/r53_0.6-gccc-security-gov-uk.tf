resource "aws_route53_record" "gccc-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "gccc"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-905.awsdns-49.net.",
    "ns-331.awsdns-41.com.",
    "ns-1595.awsdns-07.co.uk.",
    "ns-1422.awsdns-49.org."
  ]
}

resource "aws_route53_record" "gccc-ds" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "gccc"
  ttl             = local.standard_ttl
  type            = "DS"

  records = [
    "16448 13 2 37E2760D47DCF76BD08916242D63ACDABC4158FCBAC5EE005A71836211BB7EB8"
  ]
}