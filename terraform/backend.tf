terraform {
  backend "s3" {
    bucket         = "glowly-terraform-state"
    key            = "terraform.tfstate"
    region         = "ap-southeast-2"
    encrypt        = true
    use_lockfile   = true
  }
}
