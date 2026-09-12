pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'vikasss0407'

        FRONTEND_IMAGE = 'vikasss0407/nexora-frontend'
        BACKEND_IMAGE  = 'vikasss0407/nexora-backend'

        GIT_REPO   = 'https://github.com/vikas-ss0407/Nexora_Devops'
        GIT_BRANCH = 'main'

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        // =========================================================
        // 1. CHECKOUT CODE FROM GITHUB
        // =========================================================
        stage('Checkout Code') {
            steps {
                git(
                    branch: "${GIT_BRANCH}",
                    credentialsId: 'vikas_github_repo',
                    url: "${GIT_REPO}"
                )
            }
        }


        // =========================================================
        // 2. PREPARE FRONTEND ENVIRONMENT
        // =========================================================
        stage('Prepare Frontend Environment') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'Nexora_frontend',
                        variable: 'FRONTEND_ENV'
                    )
                ]) {
                    bat '''
                        copy /Y "%FRONTEND_ENV%" "DrugGuard\\.env"
                    '''
                }
            }
        }


        // =========================================================
        // 3. BUILD FRONTEND DOCKER IMAGE
        // =========================================================
        stage('Build Frontend Image') {
            steps {
                bat """
                    docker build ^
                    -t %FRONTEND_IMAGE%:%IMAGE_TAG% ^
                    -t %FRONTEND_IMAGE%:latest ^
                    ./DrugGuard
                """
            }
        }


        // =========================================================
        // 4. BUILD BACKEND DOCKER IMAGE
        // =========================================================
        stage('Build Backend Image') {
            steps {
                bat """
                    docker build ^
                    -t %BACKEND_IMAGE%:%IMAGE_TAG% ^
                    -t %BACKEND_IMAGE%:latest ^
                    ./backend
                """
            }
        }


        // =========================================================
        // 5. LOGIN TO DOCKER HUB
        // =========================================================
        stage('Docker Hub Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'DockerHub_credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    bat '''
                        echo %DOCKER_PASSWORD% | docker login ^
                        -u %DOCKER_USERNAME% ^
                        --password-stdin
                    '''
                }
            }
        }


        // =========================================================
        // 6. PUSH IMAGES TO DOCKER HUB
        // =========================================================
        stage('Push Images to Docker Hub') {
            steps {
                bat """
                    docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
                    docker push %FRONTEND_IMAGE%:latest

                    docker push %BACKEND_IMAGE%:%IMAGE_TAG%
                    docker push %BACKEND_IMAGE%:latest
                """
            }
        }


        // =========================================================
        // 7. STOP OLD CONTAINERS
        // =========================================================
        stage('Stop Existing Containers') {
            steps {
                bat '''
                    docker stop Nexora-frontend 2>NUL || exit /B 0
                    docker stop Nexora-backend 2>NUL || exit /B 0

                    docker rm Nexora-frontend 2>NUL || exit /B 0
                    docker rm Nexora-backend 2>NUL || exit /B 0
                '''
            }
        }


        // =========================================================
        // 8. RUN BACKEND CONTAINER
        // =========================================================
        stage('Run Backend Container') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'Nexora_backend',
                        variable: 'BACKEND_ENV'
                    )
                ]) {
                    bat """
                        docker run -d ^
                        --name Nexora-backend ^
                        --env-file "%BACKEND_ENV%" ^
                        -p 5000:5000 ^
                        %BACKEND_IMAGE%:%IMAGE_TAG%
                    """
                }
            }
        }


        // =========================================================
        // 9. RUN FRONTEND CONTAINER
        // =========================================================
        stage('Run Frontend Container') {
            steps {
                bat """
                    docker run -d ^
                    --name Nexora-frontend ^
                    -p 8080:80 ^
                    %FRONTEND_IMAGE%:%IMAGE_TAG%
                """
            }
        }


        // =========================================================
        // 10. VERIFY DEPLOYMENT
        // =========================================================
        stage('Verify Containers') {
            steps {
                bat '''
                    docker ps
                '''
            }
        }
    }


    // =============================================================
    // CLEANUP
    // =============================================================
    post {

        always {
            bat '''
                if exist "DrugGuard\\.env" (
                    del /F /Q "DrugGuard\\.env"
                )
            '''
        }

        success {
            echo '=============================================='
            echo 'NEXORA DEPLOYMENT SUCCESSFUL'
            echo '=============================================='
            echo 'Frontend: http://localhost:8080'
            echo 'Backend : http://localhost:5000'
            echo '=============================================='
        }

        failure {
            echo '=============================================='
            echo 'NEXORA DEPLOYMENT FAILED'
            echo 'Check the Jenkins Console Output.'
            echo '=============================================='
        }
    }
}