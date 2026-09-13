```groovy
pipeline {
    agent any

    environment {

        AWS_REGION = 'eu-north-1'

        AWS_ACCOUNT_ID = '670099380890'

        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        FRONTEND_ECR_REPO = "${ECR_REGISTRY}/nexora-frontend"
        BACKEND_ECR_REPO  = "${ECR_REGISTRY}/nexora-backend"

        GIT_REPO   = 'https://github.com/vikas-ss0407/Nexora_Devops'
        GIT_BRANCH = 'main'

        EKS_CLUSTER = 'nexora-cluster'

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        // =====================================================
        // 1. CHECKOUT
        // =====================================================

        stage('Checkout Code') {
            steps {
                git(
                    branch: "${GIT_BRANCH}",
                    credentialsId: 'vikas_github_repo',
                    url: "${GIT_REPO}"
                )
            }
        }


        // =====================================================
        // 2. PREPARE FRONTEND ENVIRONMENT
        // =====================================================

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

                        echo "Frontend environment prepared"
                    '''
                }
            }
        }


        // =====================================================
        // 3. BUILD FRONTEND IMAGE
        // =====================================================

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


        // =====================================================
        // 4. BUILD BACKEND IMAGE
        // =====================================================

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


        // =====================================================
        // 5. AWS / ECR LOGIN
        // =====================================================

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


        // =====================================================
        // 6. PUSH FRONTEND TO ECR
        // =====================================================

        stage('Push Frontend to ECR') {

            steps {

                sh '''
                    docker push "$FRONTEND_ECR_REPO:$IMAGE_TAG"
                    docker push "$FRONTEND_ECR_REPO:latest"
                '''
            }
        }


        // =====================================================
        // 7. PUSH BACKEND TO ECR
        // =====================================================

        stage('Push Backend to ECR') {

            steps {

                sh '''
                    docker push "$BACKEND_ECR_REPO:$IMAGE_TAG"
                    docker push "$BACKEND_ECR_REPO:latest"
                '''
            }
        }


        // =====================================================
        // 8. UPDATE KUBECTL CONFIGURATION
        // =====================================================

        stage('Configure EKS') {

            steps {

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ]
                ]) {

                    sh '''
                        echo "=============================================="
                        echo "Configuring EKS"
                        echo "=============================================="

                        aws sts get-caller-identity

                        rm -f /var/jenkins_home/.kube/config

                        mkdir -p /var/jenkins_home/.kube

                        aws eks update-kubeconfig \
                            --region "$AWS_REGION" \
                            --name "$EKS_CLUSTER"

                        echo "=============================================="
                        echo "Checking EKS Nodes"
                        echo "=============================================="

                        kubectl get nodes
                    '''
                }
            }
        }


        // =====================================================
        // 9. CREATE NAMESPACE
        // =====================================================

        stage('Create Namespace') {

            steps {

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ]
                ]) {

                    sh '''
                        echo "Creating Nexora namespace..."

                        kubectl apply \
                        -f kubernetes/namespace.yaml
                    '''
                }
            }
        }


        // =====================================================
        // 10. CREATE BACKEND SECRET
        // =====================================================

        stage('Create Backend Secret') {

            steps {

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ],
                    file(
                        credentialsId: 'Nexora_backend',
                        variable: 'BACKEND_ENV'
                    )
                ]) {

                    sh '''
                        echo "Creating backend secret..."

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


        // =====================================================
        // 11. DEPLOY BACKEND
        // =====================================================

        stage('Deploy Backend') {

            steps {

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ]
                ]) {

                    sh '''
                        echo "Deploying backend..."

                        sed \
                        "s|BACKEND_IMAGE_PLACEHOLDER|$BACKEND_ECR_REPO:$IMAGE_TAG|g" \
                        kubernetes/backend-deployment.yaml \
                        | kubectl apply -f -

                        kubectl apply \
                        -f kubernetes/backend-service.yaml
                    '''
                }
            }
        }


        // =====================================================
        // 12. DEPLOY FRONTEND
        // =====================================================

        stage('Deploy Frontend') {

            steps {

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ]
                ]) {

                    sh '''
                        echo "Deploying frontend..."

                        sed \
                        "s|FRONTEND_IMAGE_PLACEHOLDER|$FRONTEND_ECR_REPO:$IMAGE_TAG|g" \
                        kubernetes/frontend-deployment.yaml \
                        | kubectl apply -f -

                        kubectl apply \
                        -f kubernetes/frontend-service.yaml
                    '''
                }
            }
        }


        // =====================================================
        // 13. DEPLOY INGRESS
        // =====================================================

        stage('Deploy Ingress') {

            steps {

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ]
                ]) {

                    sh '''
                        echo "Deploying ingress..."

                        kubectl apply \
                        -f kubernetes/ingress.yaml
                    '''
                }
            }
        }


        // =====================================================
        // 14. WAIT FOR DEPLOYMENT
        // =====================================================

        stage('Wait for Deployment') {

            steps {

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ]
                ]) {

                    sh '''
                        echo "Waiting for backend deployment..."

                        kubectl rollout status \
                        deployment/nexora-backend \
                        -n nexora \
                        --timeout=180s

                        echo "Waiting for frontend deployment..."

                        kubectl rollout status \
                        deployment/nexora-frontend \
                        -n nexora \
                        --timeout=180s
                    '''
                }
            }
        }


        // =====================================================
        // 15. VERIFY
        // =====================================================

        stage('Verify EKS Deployment') {

            steps {

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'AWS Credentials'
                    ]
                ]) {

                    sh '''
                        echo "================ PODS ================"

                        kubectl get pods \
                        -n nexora \
                        -o wide

                        echo "================ SERVICES ================"

                        kubectl get services \
                        -n nexora

                        echo "================ DEPLOYMENTS ================"

                        kubectl get deployments \
                        -n nexora

                        echo "================ INGRESS ================"

                        kubectl get ingress \
                        -n nexora
                    '''
                }
            }
        }
    }


    // =============================================================
    // POST ACTIONS
    // =============================================================

    post {

        always {

            sh '''
                rm -f DrugGuard/.env 2>/dev/null || true
            '''
        }

        success {

            echo '''
            ==============================================
            NEXORA EKS DEPLOYMENT SUCCESSFUL
            ==============================================
            Images pushed to Amazon ECR
            Frontend deployed to EKS
            Backend deployed to EKS
            Kubernetes Services created
            Ingress configured
            ==============================================
            '''
        }

        failure {

            echo '''
            ==============================================
            NEXORA EKS DEPLOYMENT FAILED
            ==============================================
            Check Jenkins Console Output
            ==============================================
            '''
        }
    }
}