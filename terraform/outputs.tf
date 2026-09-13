output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "frontend_ecr_repository" {
  value = aws_ecr_repository.frontend.repository_url
}

output "backend_ecr_repository" {
  value = aws_ecr_repository.backend.repository_url
}