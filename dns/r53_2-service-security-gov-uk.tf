resource "aws_route53_record" "email-echo-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "email-echo.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-183.awsdns-22.com.",
    "ns-1337.awsdns-39.org.",
    "ns-960.awsdns-56.net.",
    "ns-1927.awsdns-48.co.uk.",
  ]
}

resource "aws_route53_record" "email-echo-prod-ds" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "email-echo.service"
  ttl             = local.standard_ttl
  type            = "DS"

  records = [
    "65372 13 2 7B850E34D3A8E6BBEF4DA36A489AC3DEA6A386FC43EE353AF9E0D149AF7D9550"
  ]
}

resource "aws_route53_record" "bimi-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "bimi.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-1605.awsdns-08.co.uk.",
    "ns-1032.awsdns-01.org.",
    "ns-658.awsdns-18.net.",
    "ns-470.awsdns-58.com.",
  ]
}

resource "aws_route53_record" "bimi-prod-ds" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "bimi.service"
  ttl             = local.standard_ttl
  type            = "DS"

  records = [
    "43783 13 2 494910309BB5F7EA8236E63189944EE89AB67448A28E4BE6B07CB3DD4E594DC4"
  ]
}

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
    "ns-1246.awsdns-27.org.",
    "ns-124.awsdns-15.com.",
    "ns-932.awsdns-52.net.",
    "ns-1747.awsdns-26.co.uk.",
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

# -------------

resource "aws_route53_record" "opencti-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "opencti.service"
  ttl             = local.standard_ttl
  type            = "NS"

  records = [
    "ns-1625.awsdns-11.co.uk.",
    "ns-441.awsdns-55.com.",
    "ns-1187.awsdns-20.org.",
    "ns-552.awsdns-05.net."
  ]
}
