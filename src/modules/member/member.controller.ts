import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignInDto } from './dto/signin.dto';
import { MemberService } from './member.service';
import { LoginDto } from './dto/login.dto';
import { TransactionInterceptor } from 'src/config/interceptor/transaction.interceptor';

@ApiTags('MEMBER')
@Controller('member')
export class MemberController {
    constructor(
        private readonly memberService: MemberService,
      ) {}
    
    
@ApiOperation({ summary: '회원가입' })
    @UseInterceptors(TransactionInterceptor)
    //@UseGuards(JwtAuthGuard)
    //@ApiBearerAuth()
    @Post('signin')
    async memberSignIn(@Body() signInDto: SignInDto) {
      return await this.memberService.memberSignIn(signInDto);
    }

    @ApiOperation({summary:'로그인'})
    @UseInterceptors(TransactionInterceptor)
    @Post('login')
    async memberLogIn(@Body() loginDto: LoginDto){
        return await this.memberService.memberLogIn(loginDto);
    }
}
