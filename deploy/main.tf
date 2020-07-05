provider "aws" {
  region = "ap-northeast-2"
}

resource "aws_instance" "example" {
  ami           = "ami-0d777f54156eae7d9"
  instance_type = "t2.micro"

  tags = {
    Name = "terraform-example"
  }

  user_data = "${file("deploy.sh")}"
}
