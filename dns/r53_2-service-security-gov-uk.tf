resource "aws_route53_record" "vuln-report-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "vulnerability-reporting.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-557.awsdns-05.net.",
    "ns-150.awsdns-18.com.",
    "ns-1263.awsdns-29.org.",
    "ns-1925.awsdns-48.co.uk.",
  ]
}

resource "aws_route53_record" "vrs-prod-ds" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "vulnerability-reporting.service"
  ttl             = local.standard_ttl
  type            = "DS"

  records = [
    "37860 13 2 2B28EA32FA36024F07E92A7471EB42B389F0DF6447BC71FED0F2125628F7867F"
  ]
}

resource "aws_route53_record" "vuln-scan-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "vulnerability-scanning.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-1505.awsdns-60.org.",
    "ns-1738.awsdns-25.co.uk.",
    "ns-862.awsdns-43.net.",
    "ns-434.awsdns-54.com.",
  ]
}

resource "aws_route53_record" "sso-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "sso.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-1503.awsdns-59.org.",
    "ns-380.awsdns-47.com.",
    "ns-1778.awsdns-30.co.uk.",
    "ns-958.awsdns-55.net.",
  ]
}

# -------------
# GC3: Internet listener zones
resource "aws_route53_record" "internet-listener-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "ad61b93ac2c54be4a5320e9d32a3daad.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-703.awsdns-23.net.",
    "ns-1257.awsdns-29.org.",
    "ns-1728.awsdns-24.co.uk.",
    "ns-323.awsdns-40.com.",
  ]
}
resource "aws_route53_record" "ingest-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "ingest.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-1036.awsdns-01.org.",
    "ns-881.awsdns-46.net.",
    "ns-1983.awsdns-55.co.uk.",
    "ns-111.awsdns-13.com.",
  ]
}
# -------------

resource "aws_route53_record" "webcaf-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "webcaf.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-715.awsdns-25.net.",
    "ns-448.awsdns-56.com.",
    "ns-2030.awsdns-61.co.uk.",
    "ns-1420.awsdns-49.org.",
  ]
}

resource "aws_route53_record" "webcaf-ds" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "webcaf.service"
  ttl             = local.standard_ttl
  type            = "DS"

  records = [
    "29233 13 2 AED8C8671A3829923964BC4CD956CD4641963B768504F13C082D0A34586764F3"
  ]
}
