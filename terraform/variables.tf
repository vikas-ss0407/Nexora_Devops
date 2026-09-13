variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "nexora-cluster"
}

variable "vpc_name" {
  description = "VPC name"
  type        = string
  default     = "nexora-vpc"
}