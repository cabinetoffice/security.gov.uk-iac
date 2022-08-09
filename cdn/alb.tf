resource "aws_alb" "main" {
  name = local.alb_name

  # launch lbs in public or private subnets based on "internal" variable
  internal            = false
  load_balancer_type  = "application"
  subnets             = terraform.workspace == "prod" ? [
      aws_subnet.public_a.id,
      aws_subnet.public_b.id
    ] : [
      aws_subnet.public_b.id,
      aws_subnet.public_c.id
    ]
  security_groups     = [aws_security_group.alb_allow_tls.id]

  tags = {
    Name = local.alb_name
  }

  # enable access logs in order to get support from aws
  #access_logs {
  #  enabled = true
  #  bucket  = "${aws_s3_bucket.lb_access_logs.bucket}"
  #}
}

resource "aws_alb_target_group" "api_tg" {
  name = local.alb_target_group_name
  target_type = "lambda"
  lambda_multi_value_headers_enabled = false

  health_check {
    enabled = false

    healthy_threshold   = 5
    unhealthy_threshold = 2
    interval            = 60
    timeout             = 5

    matcher = "200"
    path    = "/api/alb-status"
  }
}

resource "aws_lambda_permission" "api_perm" {
  statement_id  = "AllowExecutionFromlb"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_lambda.arn
  principal     = "elasticloadbalancing.amazonaws.com"
  source_arn    = aws_alb_target_group.api_tg.arn
}

resource "aws_lb_target_group_attachment" "api_att" {
  target_group_arn = aws_alb_target_group.api_tg.arn
  target_id        = aws_lambda_function.api_lambda.arn
  depends_on       = [aws_lambda_permission.api_perm]
}

resource "aws_lb_listener_rule" "health_check" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 10

  action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/html"
      message_body = "HEALTHY"
      status_code  = "200"
    }
  }

  condition {
    path_pattern {
      values = ["/api/alb-status"]
    }
  }
}

resource "aws_lb_listener_rule" "api_lambda" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.api_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api", "/api/*"]
    }
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_alb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-Ext-2018-06"
  certificate_arn   = aws_acm_certificate.api.arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/html"
      message_body = "Bad Request"
      status_code  = "400"
    }
  }
}

resource "aws_route53_record" "alb_www_api" {
 name    = "www-api"
 records = [aws_alb.main.dns_name]
 type    = "CNAME"

 ttl             = 60
 zone_id         = data.aws_route53_zone.z.zone_id
}
