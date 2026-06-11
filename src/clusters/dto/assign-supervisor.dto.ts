import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignSupervisorDto {
  @IsNotEmpty({ message: 'Le supervisorId est requis' })
  @IsUUID('4', { message: 'Le supervisorId doit être un UUID valide' })
  supervisorId: string;
}
