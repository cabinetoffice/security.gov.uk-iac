variable "IS_CI" {
  type    = bool
  default = false
}

locals {
  s3_origin_id               = "${terraform.workspace}-s3"
  primary_domain             = "${terraform.workspace == "prod" ? "security.gov.uk" : "nonprod.security.gov.uk"}"

  vpc_name                   = "vpc-${terraform.workspace}"
  vpc_public_subnet_a_name   = "${terraform.workspace}-public-subnet-a"
  vpc_public_subnet_b_name   = "${terraform.workspace}-public-subnet-b"
  vpc_public_subnet_c_name   = "${terraform.workspace}-public-subnet-c"

  alb_origin_id              = "${terraform.workspace}-alb"
  alb_name                   = "${terraform.workspace}-alb"
  alb_target_group_name      = "${terraform.workspace}-alb-tg"
  alb_ingress_sg_name        = "${terraform.workspace}-alb_allow_tls-sg"

  api_lambda_name            = "alb-api-${terraform.workspace}"
  api_iam_role               = "alb-api-role-${terraform.workspace}"
  api_iam_policy             = "alb-api-policy-${terraform.workspace}"

  origin_request_lambda_name = "lae-origin-request-${terraform.workspace}"
  origin_request_iam_role    = "lae-or-role-${terraform.workspace}"
  origin_request_iam_policy  = "lae-or-policy-${terraform.workspace}"
}

# ---- VPC and subnet information ----
# =============== prod ===============
# Main VPC:        172.16.64.0/18 = 172.16.64.0 - 172.16.127.255 (16,384)
# Public subnet A: 172.16.72.0/21 = 172.16.72.0 - 172.16.79.255  (2048)
# Public subnet B: 172.16.80.0/21 = 172.16.80.0 - 172.16.87.255  (2048)
# Public subnet C: 172.16.88.0/21 = 172.16.88.0 - 172.16.95.255  (2048)
# ============= nonprod ==============
# Main VPC:        172.16.192.0/18 = 172.16.192.0 - 172.16.255.255 (16,384)
# Public subnet A: 172.16.200.0/21 = 172.16.200.0 - 172.16.207.255 (2048)
# Public subnet B: 172.16.208.0/21 = 172.16.208.0 - 172.16.215.255 (2048)
# Public subnet C: 172.16.216.0/21 = 172.16.216.0 - 172.16.223.255 (2048)

variable "vpc_cidr" {
  type = map
  default = {
    prod    = "172.16.64.0/18"
    nonprod = "172.16.192.0/18"
  }
}
variable "vpc_public_subnet_a" {
  type = map
  default = {
    prod    = "172.16.72.0/21"
    nonprod = "172.16.200.0/21"
  }
}
variable "vpc_public_subnet_b" {
  type = map
  default = {
    prod    = "172.16.80.0/21"
    nonprod = "172.16.208.0/21"
  }
}
variable "vpc_public_subnet_c" {
  type = map
  default = {
    prod    = "172.16.88.0/21"
    nonprod = "172.16.216.0/21"
  }
}
