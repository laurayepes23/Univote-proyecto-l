import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class VoterJwtGuard extends AuthGuard("voter-jwt") {}