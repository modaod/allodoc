import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { RolesRepository } from './roles.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DoctorSearchDto } from './dto/doctor-search.dto';
import { User } from './entities/user.entity';
import { RoleName } from './entities/role.entity';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesRepository: RolesRepository,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser?: User): Promise<User> {
    // Vérifications de sécurité
    await this.validateUserCreation(createUserDto);

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Récupération des rôles
    const roles = await this.rolesRepository.findByIds(createUserDto.roleIds);
    if (roles.length !== createUserDto.roleIds.length) {
      throw new BadRequestException('Un ou plusieurs rôles sont invalides');
    }

    // Préparation des données utilisateur
    const userData = {
      ...createUserDto,
      password: hashedPassword,
      roles,
    };

    // Si c'est un médecin, valider les champs spécifiques
    if (this.isCreatingDoctor(roles)) {
      this.validateDoctorFields(createUserDto);
    }

    return await this.usersRepository.create(userData, currentUser);
  }

  async findById(id: string): Promise<User> {
    return await this.usersRepository.findById(id, ['roles', 'organization']);
  }

  async findByEmail(email: string, organizationId: string): Promise<User | null> {
    return await this.usersRepository.findByEmail(email, organizationId);
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: User): Promise<User> {
    const existingUser = await this.findById(id);

    // Vérifications de sécurité pour les modifications
    await this.validateUserUpdate(updateUserDto, existingUser);

    // Gestion du mot de passe
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    // Gestion des rôles
    if (updateUserDto.roleIds) {
      const roles = await this.rolesRepository.findByIds(updateUserDto.roleIds);
      (updateUserDto as any).roles = roles;
    }

    return await this.usersRepository.update(id, updateUserDto, currentUser);
  }

  async deactivate(id: string, currentUser?: User): Promise<User> {
    return await this.usersRepository.update(id, { isActive: false }, currentUser);
  }

  async activate(id: string, currentUser?: User): Promise<User> {
    return await this.usersRepository.update(id, { isActive: true }, currentUser);
  }

  // =============================
  // MÉTHODES SPÉCIFIQUES MÉDECINS
  // =============================
  async findDoctors(organizationId: string): Promise<User[]> {
    return await this.usersRepository.findDoctors(organizationId);
  }

  async searchDoctors(searchDto: DoctorSearchDto, organizationId: string): Promise<PaginatedResult<User>> {
    return await this.usersRepository.searchDoctors(searchDto, organizationId);
  }

  async findAvailableDoctors(organizationId: string, date?: Date): Promise<User[]> {
    return await this.usersRepository.findAvailableDoctors(organizationId, date);
  }

  async updateDoctorAvailability(id: string, availableHours: any, currentUser?: User): Promise<User> {
    const doctor = await this.findById(id);
    
    if (!doctor.isDoctor()) {
      throw new BadRequestException('L\'utilisateur n\'est pas un médecin');
    }

    return await this.usersRepository.update(id, { availableHours }, currentUser);
  }

  async togglePatientAcceptance(id: string, currentUser?: User): Promise<User> {
    const doctor = await this.findById(id);
    
    if (!doctor.isDoctor()) {
      throw new BadRequestException('L\'utilisateur n\'est pas un médecin');
    }

    return await this.usersRepository.update(
      id, 
      { acceptsNewPatients: !doctor.acceptsNewPatients }, 
      currentUser
    );
  }

  // =============================
  // MÉTHODES D'AUTHENTIFICATION
  // =============================
  async validateCredentials(email: string, password: string, organizationId: string): Promise<User | null> {
    const user = await this.findByEmail(email, organizationId);
    
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Mettre à jour la dernière connexion
    await this.usersRepository.updateLastLogin(user.id);

    return user;
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Ancien mot de passe incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await this.usersRepository.update(id, { password: hashedNewPassword });
  }

  // =============================
  // STATISTIQUES
  // =============================
  async getOrganizationStats(organizationId: string): Promise<{
    totalUsers: number;
    totalDoctors: number;
    totalSecretaries: number;
    totalAdmins: number;
    activeDoctors: number;
  }> {
    const [totalUsers, totalDoctors, totalSecretaries, totalAdmins] = await Promise.all([
      this.usersRepository.count({ organizationId, isActive: true }),
      this.usersRepository.countByRole(organizationId, RoleName.DOCTOR),
      this.usersRepository.countByRole(organizationId, RoleName.SECRETARY),
      this.usersRepository.countByRole(organizationId, RoleName.ADMIN),
    ]);

    const doctors = await this.usersRepository.findDoctors(organizationId);
    const activeDoctors = doctors.filter(doctor => doctor.acceptsNewPatients).length;

    return {
      totalUsers,
      totalDoctors,
      totalSecretaries,
      totalAdmins,
      activeDoctors,
    };
  }

  // =============================
  // MÉTHODES PRIVÉES DE VALIDATION
  // =============================
  private async validateUserCreation(createUserDto: CreateUserDto): Promise<void> {
    // Vérifier que l'email n'existe pas déjà dans l'organisation
    const emailExists = await this.usersRepository.checkEmailExists(
      createUserDto.email,
      createUserDto.organizationId,
    );

    if (emailExists) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà dans cette organisation');
    }

    // Vérifier que le numéro de licence n'existe pas déjà (si fourni)
    if (createUserDto.licenseNumber) {
      const licenseExists = await this.usersRepository.checkLicenseExists(
        createUserDto.licenseNumber,
      );

      if (licenseExists) {
        throw new ConflictException('Un médecin avec ce numéro de licence existe déjà');
      }
    }
  }

  private async validateUserUpdate(updateUserDto: UpdateUserDto, existingUser: User): Promise<void> {
    // Vérifier l'email (si changé)
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.usersRepository.checkEmailExists(
        updateUserDto.email,
        existingUser.organizationId,
        existingUser.id,
      );

      if (emailExists) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà dans cette organisation');
      }
    }

    // Vérifier le numéro de licence (si changé)
    if (updateUserDto.licenseNumber && updateUserDto.licenseNumber !== existingUser.licenseNumber) {
      const licenseExists = await this.usersRepository.checkLicenseExists(
        updateUserDto.licenseNumber,
        existingUser.id,
      );

      if (licenseExists) {
        throw new ConflictException('Un médecin avec ce numéro de licence existe déjà');
      }
    }
  }

  private isCreatingDoctor(roles: any[]): boolean {
    return roles.some(role => role.name === RoleName.DOCTOR);
  }

  private validateDoctorFields(createUserDto: CreateUserDto): void {
    if (!createUserDto.licenseNumber) {
      throw new BadRequestException('Le numéro de licence est obligatoire pour un médecin');
    }

    if (!createUserDto.specialty) {
      throw new BadRequestException('La spécialité est obligatoire pour un médecin');
    }

    if (createUserDto.consultationFee && createUserDto.consultationFee < 0) {
      throw new BadRequestException('Le tarif de consultation ne peut pas être négatif');
    }

    if (createUserDto.defaultAppointmentDuration && 
        (createUserDto.defaultAppointmentDuration < 15 || createUserDto.defaultAppointmentDuration > 120)) {
      throw new BadRequestException('La durée de rendez-vous doit être entre 15 et 120 minutes');
    }
  }
}
