provider "aws" {
  region = "eu-west-2"
}

terraform {
  backend "s3" {
    bucket = "co-security-gov-uk-tfstate"
    key    = "co-security-gov-uk-dns.tfstate"
    region = "eu-west-2"
  }
}
