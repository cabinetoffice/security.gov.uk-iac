data "aws_caller_identity" "current" {}

locals {
  domain         = "security.gov.uk"
  nonprod_domain = "nonprod.security.gov.uk"

  default_tags   = {
    "Service" : "security.gov.uk",
    "Reference" : "https://github.com/cabinetoffice/security.gov.uk-iac",
  }

  extra_low_ttl  = 30
  low_ttl        = 30 # 300
  standard_ttl   = 30 # 3600
  long_ttl       = 30 # 86400
}
