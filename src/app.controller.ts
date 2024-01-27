import * as helper from './helper/detect';
import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }


  // this code was not properly configure to accept only PNGs, will accept any image file
  // plus no validation at all, not production ready
  @Post('extract-rect-coords')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadFile(@UploadedFile() file) {
    // console.log(JSON.stringify(file));
    const rectangles = await helper.detectRectangles(file.buffer);

    // massage data to comply to id, coordinates format
    return rectangles.map((rectangle, index)=> {return{ id: index, coordinates: rectangle }} );
  }
}
