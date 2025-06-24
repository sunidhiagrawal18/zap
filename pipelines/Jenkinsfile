pipeline {
    agent any
    environment {
        ZAP_URL = "https://dcodept.unilever.com"
        ZAP_AUTH_URL = "https://dcodept.unilever.com/sso-dev/login"
        ZAP_USER = credentials('zap-username')  // Store securely in Jenkins
        ZAP_PASS = credentials('zap-password')  // Store securely in Jenkins
        ZAP_DIR = "${WORKSPACE}/zap-reports"
    }
    stages {
        stage('Setup ZAP') {
            steps {
                sh 'mkdir -p ${ZAP_DIR}'
                sh 'wget -O zap.conf https://raw.githubusercontent.com/your-repo/zap.conf'
                sh 'docker pull owasp/zap2docker-stable'
            }
        }
        stage('Run ZAP Scan') {
            steps {
                script {
                    // Start ZAP in daemon mode
                    sh 'docker run -u zap -d --name zap -p 8080:8080 -i owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true'
                    sh 'sleep 30'  // Wait for ZAP to initialize

                    // Copy scripts into container
                    sh 'docker cp unilever-auth.js zap:/zap/scripts/authentication/'
                    sh 'docker cp unilever-session.js zap:/zap/scripts/session/'

                    // Enable scripts
                    sh '''docker exec zap zap-cli -p 8080 scripts enable \
                        "unilever-auth.js" --type=authentication'''
                    sh '''docker exec zap zap-cli -p 8080 scripts enable \
                        "unilever-session.js" --type=session'''

                    // Configure context & authentication
                    sh '''docker exec zap zap-cli -p 8080 context include \
                        "https://dcodept.unilever.com.*"'''
                    sh '''docker exec zap zap-cli -p 8080 authentication set-script \
                        --script="unilever-auth.js"'''
                    sh '''docker exec zap zap-cli -p 8080 session-management set-script \
                        --script="unilever-session.js"'''

                    // Run the scan
                    sh '''docker exec zap zap-cli -p 8080 active-scan \
                        --scanner all --recursive --spider \
                        --user ${ZAP_USER} --password ${ZAP_PASS} \
                        --context "Default Context" \
                        ${ZAP_URL}'''

                    // Generate reports
                    sh 'docker exec zap zap-cli -p 8080 report -o /zap/report.html -f html'
                    sh 'docker exec zap zap-cli -p 8080 report -o /zap/report.xml -f xml'
                    sh 'docker cp zap:/zap/report.html ${ZAP_DIR}/'
                    sh 'docker cp zap:/zap/report.xml ${ZAP_DIR}/'
                }
            }
        }
        stage('Results') {
            steps {
                archiveArtifacts artifacts: 'zap-reports/**'
                // Optional: Fail pipeline on critical findings
                sh '''if grep -q "High" ${ZAP_DIR}/report.html; then
                        echo "❌ Critical vulnerabilities found!"
                        exit 1
                      fi'''
            }
        }
    }
    post {
        always {
            sh 'docker stop zap || true'
            sh 'docker rm zap || true'
        }
    }
}
