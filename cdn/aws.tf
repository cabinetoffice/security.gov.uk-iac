provider "aws" {
  region = "eu-west-2"

  default_tags {
    tags = {
      "Service" : "security.gov.uk",
      "Reference" : "https://github.com/cabinetoffice/security.gov.uk-iac",
      "Environment" : terraform.workspace
    }
  }
}

provider "aws" {
  region = "us-east-1"
  alias  = "us_east_1"

  default_tags {
    tags = {
      "Service" : "security.gov.uk",
      "Reference" : "https://github.com/cabinetoffice/security.gov.uk-iac",
      "Environment" : terraform.workspace
    }
  }
}

terraform {
  backend "s3" {
    bucket = "co-security-gov-uk-tfstate"
    key    = "co-security-gov-uk-cdn.tfstate"
    region = "eu-west-2"
  }
}
