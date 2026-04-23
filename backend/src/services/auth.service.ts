import type { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { AuthRepository } from "../repositories/auth.repository";
import { AuthSessionsRepository } from "../repositories/auth-sessions.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { ClinicsRepository } from "../repositories/clinics.repository";
import type { AuthSession, MeResponse, SignUpInput } from "../types/auth";
import { AppError } from "../utils/app-error";
import { hashPassword, hashTokenValue, verifyPassword, verifyTokenValue } from "../utils/password";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../utils/tokens";
import type { UserAccountWriteInput } from "../types/user";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type SignInInput = {
  email: string;
  password: string;
};

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const signUpSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email(),
  phone: z.string().min(10).max(30),
  password: z.string().min(8).max(120),
  clinic: z.object({
    legalName: z.string().min(3).max(160),
    tradeName: z.string().min(3).max(160),
    timezone: z.string().min(3).max(60),
  }),
});

const accountUpdateSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email(),
  phone: z.string().min(10).max(30),
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(8).max(120),
  newPassword: z.string().min(8).max(120),
}).superRefine((value, context) => {
  if (value.currentPassword === value.newPassword) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New password must be different from current password.",
      path: ["newPassword"],
    });
  }
});

export class AuthService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly authRepository: AuthRepository,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly clinicsRepository: ClinicsRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  public async signIn(input: SignInInput): Promise<AuthSession> {
    const data = signInSchema.parse(input);
    const user = await this.authRepository.findByEmail(data.email);

    if (!user || !user.isActive || !verifyPassword(data.password, user.passwordHash)) {
      throw new AppError("auth.invalid_credentials", "Invalid credentials.", 401);
    }

    const sessionId = randomUUID();
    const refreshToken = createRefreshToken({
      sub: user.id,
      clinicId: user.clinicId,
      role: user.role,
      sessionId,
    });

    await this.authSessionsRepository.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashTokenValue(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: createAccessToken({
        sub: user.id,
        clinicId: user.clinicId,
        role: user.role,
        sessionId,
      }),
      refreshToken,
      sessionId,
      clinicId: user.clinicId,
      actorId: user.id,
      role: user.role,
    };
  }

  public async refresh(input: { refreshToken: string }): Promise<AuthSession> {
    const data = refreshSchema.parse(input);
    const claims = verifyRefreshToken(data.refreshToken);

    const session = await this.authSessionsRepository.findActiveById(claims.sessionId);
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new AppError("auth.invalid_refresh_token", "Invalid refresh token.", 401);
    }

    if (!verifyTokenValue(data.refreshToken, session.refreshTokenHash)) {
      throw new AppError("auth.invalid_refresh_token", "Invalid refresh token.", 401);
    }

    const user = await this.authRepository.findById(claims.sub);
    if (!user || !user.isActive) {
      throw new AppError("auth.invalid_refresh_token", "Invalid refresh token.", 401);
    }

    await this.authSessionsRepository.revoke(session.id);

    const newSessionId = randomUUID();
    const refreshToken = createRefreshToken({
      sub: user.id,
      clinicId: user.clinicId,
      role: user.role,
      sessionId: newSessionId,
    });

    await this.authSessionsRepository.create({
      id: newSessionId,
      userId: user.id,
      refreshTokenHash: hashTokenValue(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: createAccessToken({
        sub: user.id,
        clinicId: user.clinicId,
        role: user.role,
        sessionId: newSessionId,
      }),
      refreshToken,
      sessionId: newSessionId,
      clinicId: user.clinicId,
      actorId: user.id,
      role: user.role,
    };
  }

  public async forgotPassword(input: { email: string }): Promise<{ message: string }> {
    forgotPasswordSchema.parse(input);

    return {
      message: "If the account exists, password recovery instructions will be sent.",
    };
  }

  public async signUp(input: SignUpInput): Promise<AuthSession> {
    const data = signUpSchema.parse(input);

    const result = await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const clinic = await this.clinicsRepository.create(data.clinic, manager);
      const user = await this.authRepository.create(
        {
          clinicId: clinic.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          role: "administrator",
          passwordHash: hashPassword(data.password),
          isActive: true,
        },
        manager,
      );

      await this.auditRepository.create(
        {
          clinicId: clinic.id,
          actorId: user.id,
          action: "auth.sign_up",
          targetType: "user",
          targetId: user.id,
        },
        manager,
      );

      return {
        clinicId: clinic.id,
        userId: user.id,
        role: user.role,
      };
    });

    return this.createSession({
      clinicId: result.clinicId,
      userId: result.userId,
      role: result.role,
    });
  }

  public async me(userId: string, clinicId: string): Promise<MeResponse> {
    const [user, clinic] = await Promise.all([
      this.authRepository.findProfileByIdInClinic(clinicId, userId),
      this.clinicsRepository.findByIdInClinic(clinicId, clinicId),
    ]);

    if (!user || !clinic) {
      throw new AppError("auth.unauthorized", "Unauthorized request.", 401);
    }

    return {
      user,
      clinic,
    };
  }

  public async updateAccount(userId: string, clinicId: string, input: UserAccountWriteInput): Promise<MeResponse> {
    const data = accountUpdateSchema.parse(input);
    const currentUser = await this.authRepository.findById(userId);

    if (!currentUser || currentUser.clinicId !== clinicId) {
      throw new AppError("auth.unauthorized", "Unauthorized request.", 401);
    }

    const duplicateUser = await this.authRepository.findByClinicAndEmail(clinicId, data.email, userId);
    if (duplicateUser) {
      throw new AppError("auth.email_already_in_use", "E-mail already in use for this clinic.", 409);
    }

    const user = await this.authRepository.updateAccountInClinic(clinicId, userId, data);
    const clinic = await this.clinicsRepository.findByIdInClinic(clinicId, clinicId);

    if (!user || !clinic) {
      throw new AppError("auth.unauthorized", "Unauthorized request.", 401);
    }

    await this.auditRepository.create({
      clinicId,
      actorId: userId,
      action: "auth.account.updated",
      targetType: "user",
      targetId: userId,
    });

    return {
      user,
      clinic,
    };
  }

  public async updatePassword(
    userId: string,
    clinicId: string,
    sessionId: string,
    input: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    const data = passwordUpdateSchema.parse(input);
    const user = await this.authRepository.findById(userId);

    if (!user || user.clinicId !== clinicId || !verifyPassword(data.currentPassword, user.passwordHash)) {
      throw new AppError("auth.invalid_credentials", "Invalid current password.", 401);
    }

    await this.authRepository.updatePasswordInClinic(clinicId, userId, hashPassword(data.newPassword));
    await this.authSessionsRepository.revoke(sessionId);
    await this.auditRepository.create({
      clinicId,
      actorId: userId,
      action: "auth.password.updated",
      targetType: "user",
      targetId: userId,
    });

    return {
      message: "Password updated successfully.",
    };
  }

  private async createSession(input: {
    clinicId: string;
    userId: string;
    role: AuthSession["role"];
  }): Promise<AuthSession> {
    const sessionId = randomUUID();
    const refreshToken = createRefreshToken({
      sub: input.userId,
      clinicId: input.clinicId,
      role: input.role,
      sessionId,
    });

    await this.authSessionsRepository.create({
      id: sessionId,
      userId: input.userId,
      refreshTokenHash: hashTokenValue(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: createAccessToken({
        sub: input.userId,
        clinicId: input.clinicId,
        role: input.role,
        sessionId,
      }),
      refreshToken,
      sessionId,
      clinicId: input.clinicId,
      actorId: input.userId,
      role: input.role,
    };
  }
}
