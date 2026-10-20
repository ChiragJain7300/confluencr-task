import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return " Welcome to the Confluencr Task API, please refer the docs for API Endpoints "
  }
}
