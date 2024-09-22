import { Body, Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignInDto } from './dto/signin.dto';
import { MemberService } from './member.service';
import { UserValidationDto } from './dto/login.dto';
import { MemberIdDto } from './dto/member.id';

@ApiTags('Member')
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @ApiOperation({ summary: '회원가입' })
  @Post('signin')
  async memberSignIn(@Body() signInDto: SignInDto) {
    return await this.memberService.memberSignIn(signInDto);
  }

  @ApiOperation({ summary: '사용자 유효성 검사' })
  @Get('validation/:snsId')
  async memberValidate(@Param() userValidationDto: UserValidationDto) {
    return await this.memberService.memberValidate(userValidationDto);
  }

  @ApiOperation({ summary: '마이페이지 - 첫 화면 사용자 정보 요약' })
  @Get('my-page/:memberId')
  async myPageOverview(@Param() memberIdDto: MemberIdDto) {
    return await this.memberService.myPageOverview(memberIdDto);
  }
}
