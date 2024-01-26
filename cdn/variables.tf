variable "IS_CI" {
  type    = bool
  default = false
}

locals {
  s3_origin_id   = "${terraform.workspace}-s3"
  s3_bucket_name = terraform.workspace == "prod" ? "security.gov.uk-cdn" : "nonprod.security.gov.uk"
  primary_domain = terraform.workspace == "prod" ? "security.gov.uk" : "nonprod.security.gov.uk"

  api_origin_id = "${terraform.workspace}-api"

  api_lambda_name = "alb-api-${terraform.workspace}"
  api_iam_role    = "alb-api-role-${terraform.workspace}"
  api_iam_policy  = "alb-api-policy-${terraform.workspace}"

  origin_request_lambda_name = "lae-origin-request-${terraform.workspace}"
  origin_request_iam_role    = "lae-or-role-${terraform.workspace}"
  origin_request_iam_policy  = "lae-or-policy-${terraform.workspace}"
}
