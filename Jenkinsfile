pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        AWS_REGION = 'eu-north-1'
        AWS_ACCOUNT_ID = '670099380890'
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        FRONTEND_ECR_REPO = "${ECR_REGISTRY}/nexora-frontend"
        BACKEND_ECR_REPO = "${ECR_REGISTRY}/nexora-backend"

        GIT_REPO = 'https://github.com/vikas-ss0407/Nexora_Devops'
        GIT_BRANCH = 'main'

        EKS_CLUSTER = 'nexora-cluster'

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git(
                    branch: "${GIT_BRANCH}",
                    credentialsId: 'vikas_github_repo',
                    url: "${GIT_REPO}"
                )
            }
        }

        stage('Prepare Frontend Environment') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'Nexora_frontend',
                        variable: 'FRONTEND_ENV'
                    )
                ]) {
                    sh '''
                        cp "$FRONTEND_ENV" DrugGuard/.env
                        test -s DrugGuard/.env
                    '''
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                    docker build \
                        -t "$FRONTEND_ECR_REPO:$IMAGE_TAG" \
                        -t "$FRONTEND_ECR_REPO:latest" \
                        ./DrugGuard
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                    docker build \
                        -t "$BACKEND_ECR_REPO:$IMAGE_TAG" \
                        -t "$BACKEND_ECR_REPO:latest" \
                        ./backend
                '''
            }
        }

        stage('Login to AWS ECR') {
            steps {
                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ]
                ]) {
                    sh '''
                        aws sts get-caller-identity

                        aws ecr get-login-password \
                            --region "$AWS_REGION" \
                            | docker login \
                            --username AWS \
                            --password-stdin "$ECR_REGISTRY"
                    '''
                }
            }
        }

        stage('Push Images to ECR') {
            steps {
                sh '''
                    docker push "$FRONTEND_ECR_REPO:$IMAGE_TAG"
                    docker push "$FRONTEND_ECR_REPO:latest"

                    docker push "$BACKEND_ECR_REPO:$IMAGE_TAG"
                    docker push "$BACKEND_ECR_REPO:latest"
                '''
            }
        }

        stage('Configure EKS') {
            steps {
                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ]
                ]) {
                    sh '''
                        aws sts get-caller-identity

                        rm -f /var/jenkins_home/.kube/config

                        mkdir -p /var/jenkins_home/.kube

                        aws eks update-kubeconfig \
                            --region "$AWS_REGION" \
                            --name "$EKS_CLUSTER"

                        kubectl get nodes
                    '''
                }
            }
        }

        stage('Create Namespace') {
            steps {
                sh '''
                    kubectl apply \
                        -f kubernetes/namespace.yaml
                '''
            }
        }

        stage('Create Backend Secret') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'Nexora_backend',
                        variable: 'BACKEND_ENV'
                    )
                ]) {
                    sh '''
                        kubectl create secret generic nexora-backend-secret \
                            --namespace=nexora \
                            --from-env-file="$BACKEND_ENV" \
                            --dry-run=client \
                            -o yaml \
                            | kubectl apply -f -
                    '''
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                sh '''
                    sed \
                        "s|BACKEND_IMAGE_PLACEHOLDER|$BACKEND_ECR_REPO:$IMAGE_TAG|g" \
                        kubernetes/backend-deployment.yaml \
                        | kubectl apply -f -

                    kubectl apply \
                        -f kubernetes/backend-service.yaml
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                    sed \
                        "s|FRONTEND_IMAGE_PLACEHOLDER|$FRONTEND_ECR_REPO:$IMAGE_TAG|g" \
                        kubernetes/frontend-deployment.yaml \
                        | kubectl apply -f -

                    kubectl apply \
                        -f kubernetes/frontend-service.yaml
                '''
            }
        }

        stage('Deploy Ingress') {
            steps {
                sh '''
                    kubectl apply \
                        -f kubernetes/ingress.yaml
                '''
            }
        }

        stage('Wait for Deployment') {
            steps {
                sh '''
                    kubectl rollout status \
                        deployment/nexora-backend \
                        -n nexora \
                        --timeout=180s

                    kubectl rollout status \
                        deployment/nexora-frontend \
                        -n nexora \
                        --timeout=180s
                '''
            }
        }

        stage('Verify EKS Deployment') {
            steps {
                sh '''
                    echo "Pods:"
                    kubectl get pods -n nexora -o wide

                    echo "Services:"
                    kubectl get services -n nexora

                    echo "Deployments:"
                    kubectl get deployments -n nexora

                    echo "Ingress:"
                    kubectl get ingress -n nexora
                '''
            }
        }
    }

    post {
        always {
            sh '''
                rm -f DrugGuard/.env 2>/dev/null || true
            '''
        }

        success {
            echo 'NEXORA EKS DEPLOYMENT SUCCESSFUL'
        }

        failure {
            echo 'NEXORA EKS DEPLOYMENT FAILED - CHECK JENKINS CONSOLE OUTPUT'
        }
    }
}
