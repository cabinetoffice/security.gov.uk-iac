resource "aws_route53_record" "cybergsec-delegated-zone" {
  zone_id         = aws_route53_zone.sec-gov-uk.zone_id
  allow_overwrite = true
  name            = "cybergsec"
  ttl             = 3600
  type            = "NS"

  records = [
    "dns1.comlaude-dns.com",
    "dns2.comlaude-dns.net",
    "dns3.comlaude-dns.co.uk",
    "dns4.comlaude-dns.eu",
  ]
}
