locals {
  assets_bucket_name = "${var.appname}-assets"

  lambda_file      = "../dist/lambda.zip"
  source_code_hash = "${base64sha256(file("${local.lambda_file}"))}"

  # Unfortunately there is a bug in terraform which leads to the destruction of existing resources if
  # the element order of lists and maps changes cf. https://github.com/hashicorp/terraform/issues/16210
  # Elements of maps are ordered alphabetically. So each element has a prefix to preserve the order.
  # This prefix is not part of the stage name and will be removed internally.
  # If you add stages use keys which result in the stage appended at the end of the list!
  # If you are uncertain use terraform plan to check the changes terraform would make.
  stages = {
    "a_prod" = "318"
    "b_dev"  = "$LATEST"
    "c_qas" = "318"
    "d_version" = "318"
  }

  // to avoid unnecessary lambda function deployments the build version env var is only changed if the lambda function code has been changed
  build_version = "${local.source_code_hash != data.terraform_remote_state.app.source_code_hash ? var.build_version : data.terraform_remote_state.app.build_version}"
}

module "serverless_lambda_app" {
  source             = "modules/serverless_lambda_app"
  stages             = "${local.stages}"
  appname            = "${var.appname}"
  lambda_file        = "${local.lambda_file}"
  source_code_hash   = "${local.source_code_hash}"
  lambda_handler     = "lambda.handler"
  lambda_runtime     = "nodejs12.x"
  assets_bucket_name = "${local.assets_bucket_name}"

  # Which rights should the lambda function have.
  # Terraform user must have appropriate rights to attach these policies!
  lambda_policy_attachements = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess",
  ]

  lambda_environment_vars = {
    SIGNATURE_SECRET = "${var.signature_secret}"
    BUILD_VERSION    = "${local.build_version}"
    IVANTI_API_KEY_STG = "0FF464CC574E4C3D9E53B1D115D2D313"
    IVANTI_API_KEY_UAT = "98328916143C45DE8C67854F861969C2"
    IVANTI_API_KEY_PROD = "99DCF698F0544FAEBAD9FDC2BA662A5D"
    SERVICE_USER_API_KEY_DEV = "Cy+WA7YzECj8IYKGgrOInlfyuPiCNcg21Aeph9R3LoYblSLYCIhDe0OgiYDxVofjL/FGx4YOvrLFcVWKpAIv3KvGzIBvfPJE+nd2F3rbm+o=&_z_A0V5ayCRLKHyGiKljGWctnbxoIg2TljVV_ahxt5lGqqeOlQd-h-R6BxEl3qQvJ9jaNO9Mk5HYk1iw58H1Hh3TzBQCwGTS"
    SERVICE_USER_API_KEY_QAS = "UrvrtejEZ6OUU7rAcWjXtDYJR4B1CGqO/YENylC6pwXJ0Gjv5eZbegbsRSRFi9yHkkDTGC4BrqBM0auBRAxJPwV3Kt0h2BVMPnYIEy7MqhU=&_z_A0V5ayCTcaFc6GHG51iS-2L0YTITyrORe5L3jKomPqF-v4_VHYi1x7pyoLCVdnfYMzxIBqDNAnVJ-pQ9QcpfXzV_w-OVu"
    SERVICE_USER_API_KEY_VERSION = "zZUZkjoQIXzkD9RPGSnVK6F0lYzrxjKr+fsavchB+IIISZDqQyteVkra3Q/h69tCc5SkXo/XtTvAJYaRLvPgYjGN/awCSlJXtA8WyVCanCE=&_z_A0V5ayCS7tuzTo07c56NF_be5j1PCjHkvsWR5USpCWRCwaCC4qCMRABL0pKMFN4QQrhd5yeZxbohzxQW_eMye9nSBKu8m"
    SERVICE_USER_API_KEY_PROD = "vCnzaBqkBv41uAGzSUfyDM35WusKsFptg7R9cYMsUFwUlK8Xm9GYWbtRFMYecba38pATWY5oNbCfzuxrJowAvcrCU6+ittF8fFrxlcY3Z1Y=&_z_A0V5ayCRgXTZUCkxug3TAmJk5k6WgIm4QkjyhE5nfYPOzr8PoXeMaYizFSkqs-a_JNKyLF4lrs-pvo6Ri28Z8PyWNxjwY"

    # change to ASSET_BASE_PATH  = "https://${module.asset_cdn.dns_name}/${var.asset_hash}" if asset_cdn is enabled
    ASSET_BASE_PATH = "https://${local.assets_bucket_name}.s3.amazonaws.com/${var.asset_hash}"
  }

  aws_region = "${var.aws_region}"
}

# Uncomment if you want to use cloudfront (a CDN) to deliver your assets OR custom domain names for your API endpoints.
# IMPORTANT:
# - Both, the cloudfront distribution and a custom domain name für API endpoints require a DNS hosted zone.
#   So this resources must be uncommented if you want to use either of them.
# cf. https://www.terraform.io/docs/providers/aws/d/route53_zone.html
/*
resource "aws_route53_zone" "hosted_zone" {
  name = "${var.appname}${var.domainsuffix}"
}
output "nameserver" {
  value = "${aws_route53_zone.hosted_zone.name_servers}"
}
*/

# Uncomment if you want to use cloudfront (a CDN) to deliver your assets.
# IMPORTANT:
# - This module requires a working dns resolution for your hosted zone because
#   the module creates certificates which ar validated via DNS
# - The module might fail because it will take some time (up to or more than 30 min)
#   for a certificate to be validated by AWS. If this is the case just invoke terraform a second time.
/*
module "asset_cdn" {
  source                = "modules/cloudfront_distribution"
  hosted_zone_id        = "${aws_route53_zone.hosted_zone.id}"
  custom_subdomain_name = "assets"
  origin_domain_name    = "${module.serverless_lambda_app.assets_bucket_domain_name}"
}
*/

# Uncomment if you want to use custom domain names for your API endpoints.
# cf. https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html
# IMPORTANT:
# - This module requires a working dns resolution for your hosted zone because
#   the module creates certificates which ar validated via DNS
# - The module might fail because it will take some time (up to or more than 30 min)
#   for a certificate to be validated by AWS. If this is the case just invoke terraform a second time.
/*
module "api_custom_domains" {
  source                                                = "modules/api_custom_domain"
  hosted_zone_id                                        = "${aws_route53_zone.hosted_zone.id}"
  aws_api_gateway_rest_api_id                           = "${module.serverless_lambda_app.aws_api_gateway_rest_api_id}"
  aws_api_gateway_rest_api_endpoint_configuration_types = "${module.serverless_lambda_app.aws_api_gateway_rest_api_endpoint_configuration_types}"
  stages                                                = "${module.serverless_lambda_app.stages}"
}
*/
