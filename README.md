# 🚀 Jenkins CI/CD Multi-Environment Deployment Guide

This guide provides step-by-step instructions to set up a target AWS EC2 instance for deploying Node.js applications across **Development (Dev)**, **Staging (Stage)**, and **Production (Prod)** environments using Jenkins.

---

## 📋 Prerequisites
- A fresh AWS EC2 Instance running **Ubuntu 24.04 LTS** (Recommended: `t2.medium` or `t3.small`).
- SSH Key Pair (`.pem`) for connecting to the EC2 instance.
- Jenkins Master Server configured with Docker and SSH Agent plugins.

---

## 🛠️ Step 1: Prepare the Target EC2 Server

Connect to your new EC2 instance via SSH and run the following script to install **Docker** and configure required firewall ports:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
sudo apt install -y docker.io

# 3. Add current user and jenkins user to Docker group
sudo usermod -aG docker ubuntu
sudo systemctl restart docker

# 4. Open required application ports in Ubuntu UFW firewall (if enabled)
sudo ufw allow 22/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 3002/tcp
sudo ufw allow 3003/tcp
sudo ufw reload