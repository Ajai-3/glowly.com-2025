data "aws_ami" "ubuntu" {
  owners      = ["099720109477"]
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_ip_ranges" "ec2_connect" {
  regions  = ["ap-southeast-2"]
  services = ["ec2_instance_connect"]
}

resource "aws_security_group" "glowly" {
  name        = "glowly-sg"
  description = "SSH for AWS browser connect, HTTP, HTTPS"

  ingress {
    description = "SSH from AWS browser Connect"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "glowly-ec2" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t3.micro"
  vpc_security_group_ids      = [aws_security_group.glowly.id]
  associate_public_ip_address = true

  user_data = <<-EOF
    #!/bin/bash

    apt update && apt upgrade -y

    apt install -y git curl

    curl -fsSL https://get.docker.com | sh

    apt install -y docker-compose-plugin

    usermod -aG docker ubuntu
  EOF

  tags = {
    Name = "Glowly"
  }
}

output "public_ip" {
  value = aws_instance.glowly-ec2.public_ip
}

output "ssh_host" {
  value = aws_instance.glowly-ec2.public_ip
}

output "ssh_username" {
  value = "ubuntu"
}