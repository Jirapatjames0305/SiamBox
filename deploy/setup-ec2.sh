#!/usr/bin/env bash
# First-time provisioning for an Ubuntu 24.04 instance (Alibaba ECS / any cloud).
# Installs Docker + Compose and adds a 2 GB swapfile as a safety margin for the
# image build on small instances. Run once after first SSH:
#
#   bash setup-ec2.sh && newgrp docker
#
set -euo pipefail

sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git

# Docker Engine + Compose plugin (official convenience script)
if ! command -v docker >/dev/null 2>&1; then
	curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"

# 2 GB swap — keeps `pnpm install` during the image build from running out of memory
if [ ! -f /swapfile ]; then
	sudo fallocate -l 2G /swapfile
	sudo chmod 600 /swapfile
	sudo mkswap /swapfile
	sudo swapon /swapfile
	echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "Done. Log out/in (or run 'newgrp docker') so the docker group applies."
