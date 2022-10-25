output "primary_ds_record" {
  value       = "${local.domain}. ${local.low_ttl} IN DS ${aws_route53_key_signing_key.primary.ds_record}"
  description = "The primary DS record for security.gov.uk"
}

output "primary_dnskey_record" {
  value       = "${local.domain}. ${local.low_ttl} IN DNSKEY ${aws_route53_key_signing_key.primary.dnskey_record}"
  description = "The primary DNSKEY record for security.gov.uk"
}

output "secondary_ds_record" {
  value       = "${local.domain}. ${local.low_ttl} IN DS ${aws_route53_key_signing_key.secondary.ds_record}"
  description = "The secondary DS record for security.gov.uk"
}

output "secondary_dnskey_record" {
  value       = "${local.domain}. ${local.low_ttl} IN DNSKEY ${aws_route53_key_signing_key.secondary.dnskey_record}"
  description = "The secondary DNSKEY record for security.gov.uk"
}

output "ds_records" {
  value       = "${local.domain}. ${local.low_ttl} IN DS ${aws_route53_key_signing_key.primary.ds_record}\n${local.domain}. ${local.low_ttl} IN DS ${aws_route53_key_signing_key.secondary.ds_record}"
  description = "The DS records for security.gov.uk"
}

# =====

resource "aws_route53_key_signing_key" "primary" {
  hosted_zone_id             = aws_route53_zone.sec-gov-uk.id
  key_management_service_arn = aws_kms_key.primary_dnssec_key.arn
  name                       = "${local.domain}-primary"
}

resource "aws_route53_key_signing_key" "secondary" {
  hosted_zone_id             = aws_route53_zone.sec-gov-uk.id
  key_management_service_arn = aws_kms_key.secondary_dnssec_key.arn
  name                       = "${local.domain}-secondary"
}

resource "aws_route53_hosted_zone_dnssec" "sec-gov-uk" {
  depends_on     = [
    aws_route53_key_signing_key.primary,
    aws_route53_key_signing_key.secondary
  ]
  hosted_zone_id = aws_route53_key_signing_key.primary.hosted_zone_id
}

# ==== KMS aliases ====

resource "aws_kms_alias" "primary" {
  provider      = aws.us_east_1
  name          = "alias/dnssec/primary/security-gov-uk/1"
  target_key_id = aws_kms_key.primary_dnssec_key.key_id
}

resource "aws_kms_alias" "primary_replica" {
  name          = "alias/dnssec/primary_replica/security-gov-uk/1"
  target_key_id = aws_kms_replica_key.primary_replica_london.key_id
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.us_east_1
  name          = "alias/dnssec/secondary/security-gov-uk/1"
  target_key_id = aws_kms_key.secondary_dnssec_key.key_id
}

resource "aws_kms_alias" "secondary_replica" {
  name          = "alias/dnssec/secondary_replica/security-gov-uk/1"
  target_key_id = aws_kms_replica_key.secondary_replica_london.key_id
}

# ==== KMS keys in us-east-1 (N. Virginia) ====

resource "aws_kms_key" "primary_dnssec_key" {
  provider     = aws.us_east_1
  description  = "security.gov.uk DNSSEC primary key"

  tags         = merge(local.default_tags, {
    "Name" : "${local.domain}-DNSSEC-primary",
    "Environment" : "prod"
  })

  lifecycle {
    ignore_changes = [tags]
  }

  customer_master_key_spec = "ECC_NIST_P256"
  key_usage                = "SIGN_VERIFY"
  multi_region             = true

  policy = jsonencode({
    Statement = [
      {
        Action = [
          "kms:DescribeKey",
          "kms:GetPublicKey",
          "kms:Sign",
        ],
        Effect = "Allow"
        Principal = {
          Service = "dnssec-route53.amazonaws.com"
        }
        Sid      = "Allow Route 53 DNSSEC Service",
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
          ArnLike = {
            "aws:SourceArn" = "arn:aws:route53:::hostedzone/*"
          }
        }
      },
      {
        Action = "kms:CreateGrant",
        Effect = "Allow"
        Principal = {
          Service = "dnssec-route53.amazonaws.com"
        }
        Sid      = "Allow Route 53 DNSSEC Service to CreateGrant",
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = true
          }
        }
      },
      {
        Action = "kms:*"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Resource = "*"
        Sid      = "Enable IAM User Permissions"
      },
    ]
    Version = "2012-10-17"
  })
}

resource "aws_kms_key" "secondary_dnssec_key" {
  provider     = aws.us_east_1
  description  = "security.gov.uk DNSSEC secondary key"

  tags         = merge(local.default_tags, {
    "Name" : "${local.domain}-DNSSEC-secondary",
    "Environment" : "prod"
  })

  lifecycle {
    ignore_changes = [tags]
  }

  customer_master_key_spec = "ECC_NIST_P256"
  key_usage                = "SIGN_VERIFY"
  multi_region             = true

  policy = jsonencode({
    Statement = [
      {
        Action = [
          "kms:DescribeKey",
          "kms:GetPublicKey",
          "kms:Sign",
        ],
        Effect = "Allow"
        Principal = {
          Service = "dnssec-route53.amazonaws.com"
        }
        Sid      = "Allow Route 53 DNSSEC Service",
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
          ArnLike = {
            "aws:SourceArn" = "arn:aws:route53:::hostedzone/*"
          }
        }
      },
      {
        Action = "kms:CreateGrant",
        Effect = "Allow"
        Principal = {
          Service = "dnssec-route53.amazonaws.com"
        }
        Sid      = "Allow Route 53 DNSSEC Service to CreateGrant",
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = true
          }
        }
      },
      {
        Action = "kms:*"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Resource = "*"
        Sid      = "Enable IAM User Permissions"
      },
    ]
    Version = "2012-10-17"
  })
}

# ==== replica KMS keys in eu-west-2 (London)) ====

resource "aws_kms_replica_key" "primary_replica_london" {
  description             = "security.gov.uk DNSSEC replica key (primary in us-east-1)"
  primary_key_arn         = aws_kms_key.primary_dnssec_key.arn

  tags                    = merge(local.default_tags, {
    "Name" : "${local.domain}-DNSSEC-primary-replica",
    "Environment" : "prod"
  })

  lifecycle {
    ignore_changes = [tags]
  }
}

resource "aws_kms_replica_key" "secondary_replica_london" {
  description             = "security.gov.uk DNSSEC secondary replica key (secondary in us-east-1)"
  primary_key_arn         = aws_kms_key.secondary_dnssec_key.arn

  tags                    = merge(local.default_tags, {
    "Name" : "${local.domain}-DNSSEC-secondary-replica",
    "Environment" : "prod"
  })

  lifecycle {
    ignore_changes = [tags]
  }
}
