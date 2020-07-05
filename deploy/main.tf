provider "aws" {
  region = "ap-northeast-2"
}

resource "aws_instance" "example" {
  ami           = "ami-0539a1389fedcbdc8"
  instance_type = "t2.micro"
  vpc_security_group_ids = ["${aws_security_group.instance.id}"]

  tags = {
    Name = "terraform-example"
  }

  user_data = "${file("deploy.sh")}"
}

resource "aws_security_group" "instance" {
  name = "terraform-example-instance"

  ingress {
    from_port = 2567
    to_port = 2567
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}