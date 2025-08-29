# About this Terraform stack

This stack creates an Oracle Database 23ai OCI Base Database Services environment with a Data Guard association.
* `adghol0-${resId}`: Primary db_system
* `adghol1-${resId}`: Data Guard association

**IMPORTANT!!! It won't work out of the box in your environment, as it's based on a personal, pre-configured VCN "misc_labs".**

You can easily derive a Terraform stack that will work in any environment (I will do it at some point).

## Usage

1. Fill in `terraform/variables.tf` with your OCI credentials and configuration.
2. Run `terraform init` and `terraform apply`.