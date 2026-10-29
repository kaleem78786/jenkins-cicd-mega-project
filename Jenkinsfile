pipeline {
    agent any

    // 1. Build Parameters (Jenkins UI mein dropdown/checkbox banayega)
    parameters {
        booleanParam(name: 'DEPLOY_TO_PROD', defaultValue: true, description: 'Kya Stage ke baad Production par deploy karna hai?')
    }

    // 2. Global Environment Variables
    environment {
        DOCKERHUB_USER = "kaleem78786"
        APP_NAME       = "jenkins-mega-app"
        IMAGE_TAG      = "${DOCKERHUB_USER}/${APP_NAME}:v${BUILD_NUMBER}"
        LATEST_TAG     = "${DOCKERHUB_USER}/${APP_NAME}:latest"
        
        // AWS EC2 Target Server IP (Agar 3 alag EC2 hain toh DEV_IP, STAGE_IP, PROD_IP alag rakh sakte hain)
        TARGET_SERVER_IP = "13.48.31.8"
        SSH_USER         = "ubuntu"
        
        // 3 Environments ke 3 Alag Ports
        DEV_PORT   = "3001"
        STAGE_PORT = "3002"
        PROD_PORT  = "3003"
    }

    // 3. Pipeline Options (Purane builds delete rakhna aur timestamps lagana)
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo "📥 GitHub se latest code pull ho raha hai..."
                checkout scm
            }
        }

        stage('2. Install & Unit Tests') {
            steps {
                echo "🧪 Dependencies install aur Automated Unit Tests chal rahe hain..."
                sh '''
                    npm install
                    npm test
                '''
            }
        }

        stage('3. Build & Push Docker Image') {
            steps {
                echo "🐳 Docker Image build ho rahi hai: ${IMAGE_TAG}"
                sh '''
                    docker build -t ${IMAGE_TAG} -t ${LATEST_TAG} .
                '''
                
                echo "📤 DockerHub par Image push ho rahi hai..."
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${IMAGE_TAG}
                        docker push ${LATEST_TAG}
                    '''
                }
            }
        }

        stage('4. Deploy & Health Check - DEV') {
            steps {
                echo "🚀 DEV Environment (Port ${DEV_PORT}) par deploy ho raha hai..."
                sshagent(['aws-ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${SSH_USER}@${TARGET_SERVER_IP} "
                            docker pull ${IMAGE_TAG}
                            docker stop app-dev || true
                            docker rm app-dev || true
                            docker run -d --name app-dev --restart always \
                                -p ${DEV_PORT}:3000 \
                                -e APP_ENV=dev \
                                -e APP_VERSION=v${BUILD_NUMBER} \
                                ${IMAGE_TAG}
                        "
                    '''
                }
                
                echo "🩺 DEV Health Check chal raha hai..."
                sh '''
                    sleep 5
                    curl -f http://${TARGET_SERVER_IP}:${DEV_PORT}/health
                '''
            }
        }

stage('5. Deploy & Health Check - STAGE') {
    steps {
        echo "🚀 STAGE Environment (Port ${STAGE_PORT}) par deploy ho raha hai..."
        sshagent(['aws-ec2-ssh-key']) {
            sh '''
                ssh -o StrictHostKeyChecking=no ${SSH_USER}@${TARGET_SERVER_IP} "
                    docker stop app-stage || true
                    docker rm app-stage || true
                    docker run -d --name app-stage --restart always \
                        -p ${STAGE_PORT}:3000 \
                        -e APP_ENV=staging \
                        -e APP_VERSION=v${BUILD_NUMBER} \
                        ${IMAGE_TAG}
                "
            '''
        }
        echo "🩺 STAGE Health Check chal raha hai..."
        sh '''
            sleep 5
            curl -f http://${TARGET_SERVER_IP}:${STAGE_PORT}/health
        '''
    }
}

        stage('6. Manual Approval for PROD') {
            when {
                expression { return params.DEPLOY_TO_PROD == true }
            }
            steps {
                echo "⏳ Production deployment ke liye approval ka intezar hai..."
                timeout(time: 15, unit: 'MINUTES') {
                    input message: 'Stage Health Check PASS ho chuka hai! Kya PROD par deploy kar dein?', ok: 'Haan, Deploy to PROD!'
                }
            }
        }

 stage('7. Deploy & Health Check - PROD') {
    when {
        expression { return params.DEPLOY_TO_PROD == true }
    }
    steps {
        echo "🔥 PRODUCTION Environment (Port ${PROD_PORT}) par deploy ho raha hai..."
        script {
            try {
                sshagent(['aws-ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${SSH_USER}@${TARGET_SERVER_IP} "
                            docker stop app-prod-backup || true
                            docker rm app-prod-backup || true
                            docker rename app-prod app-prod-backup || true
                            docker stop app-prod-backup || true
                            
                            docker run -d --name app-prod --restart always \
                                -p ${PROD_PORT}:3000 \
                                -e APP_ENV=production \
                                -e APP_VERSION=v${BUILD_NUMBER} \
                                ${IMAGE_TAG}
                        "
                    '''
                }
                echo "🩺 PROD Health Check chal raha hai..."
                sh '''
                    sleep 5
                    curl -f http://${TARGET_SERVER_IP}:${PROD_PORT}/health
                '''
            } catch (Exception e) {
                echo "🚨 PROD Health Check FAIL ho gaya! Auto-Rollback..."
                sshagent(['aws-ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${SSH_USER}@${TARGET_SERVER_IP} "
                            docker stop app-prod || true
                            docker rm app-prod || true
                            docker rename app-prod-backup app-prod || true
                            docker start app-prod || true
                        "
                    '''
                }
                error("Production failed! Rollback done.")
            }
        }
    }
}
    }

    // 4. Post-Build Actions (Cleanup + Email Alerts)
    post {
        always {
            echo "🧹 Workspace aur unused Docker images clean ki ja rahi hain..."
            sh 'docker image prune -f || true'
        }
        success {
            emailext (
                subject: "✅ SUCCESS: Job '${env.JOB_NAME}' [Build #${env.BUILD_NUMBER}]",
                body: """
                    <h2>🎉 Jenkins CI/CD Pipeline Kamyab Rahi!</h2>
                    <p><b>Project:</b> ${env.JOB_NAME}</p>
                    <p><b>Build Number:</b> #${env.BUILD_NUMBER}</p>
                    <p><b>Docker Image:</b> ${IMAGE_TAG}</p>
                    <hr/>
                    <h3>🌐 Live Environment Links:</h3>
                    <ul>
                        <li><b>DEV:</b> http://${TARGET_SERVER_IP}:${DEV_PORT}</li>
                        <li><b>STAGE:</b> http://${TARGET_SERVER_IP}:${STAGE_PORT}</li>
                        <li><b>PROD:</b> http://${TARGET_SERVER_IP}:${PROD_PORT}</li>
                    </ul>
                    <p>Build Logs dekhne ke liye yahan click karein: <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                """,
                mimeType: 'text/html',
                to: "YOUR_EMAIL@gmail.com"
            )
        }
        failure {
            emailext (
                subject: "❌ FAILED: Job '${env.JOB_NAME}' [Build #${env.BUILD_NUMBER}]",
                body: """
                    <h2>🚨 Jenkins Pipeline Fail Ho Gayi Hai!</h2>
                    <p><b>Project:</b> ${env.JOB_NAME}</p>
                    <p><b>Build Number:</b> #${env.BUILD_NUMBER}</p>
                    <p>Foran error logs check karein: <a href="${env.BUILD_URL}console">${env.BUILD_URL}console</a></p>
                """,
                mimeType: 'text/html',
                to: "YOUR_EMAIL@gmail.com"
            )
        }
    }
}
