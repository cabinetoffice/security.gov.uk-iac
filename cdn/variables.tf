locals {
  origin_id        = "${terraform.workspace == "prod" ? "security_gov_uk" : "nonprod_security_gov_uk"}"
  primary_domain   = "${terraform.workspace == "prod" ? "security.gov.uk" : "nonprod.security.gov.uk"}"
}
