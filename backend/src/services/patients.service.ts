import { z } from "zod";

import { PatientsRepository } from "../repositories/patients.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { Patient } from "../types/patient";
import type { PatientWriteInput } from "../types/patient";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";

const patientWriteSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(8).max(30),
});

export class PatientsService {
  public constructor(private readonly patientsRepository: PatientsRepository) {}

  public async list(user: AuthenticatedRequestUser, paginationInput: PaginationInput = {}): Promise<PaginatedResult<Patient>> {
    return this.patientsRepository.findAll(user.clinicId, parsePagination(paginationInput));
  }

  public async create(user: AuthenticatedRequestUser, input: PatientWriteInput): Promise<Patient> {
    const data = patientWriteSchema.parse({
      ...input,
      email: input.email ?? null,
    });
    return this.patientsRepository.create(user.clinicId, {
      fullName: data.fullName,
      phone: data.phone,
      ...(data.email === undefined ? {} : { email: data.email }),
    });
  }

  public async update(user: AuthenticatedRequestUser, id: string, input: PatientWriteInput): Promise<Patient> {
    const data = patientWriteSchema.parse({
      ...input,
      email: input.email ?? null,
    });

    const patient = await this.patientsRepository.updateInClinic(user.clinicId, id, {
      fullName: data.fullName,
      phone: data.phone,
      ...(data.email === undefined ? {} : { email: data.email }),
    });
    if (!patient) {
      throw new AppError("patients.not_found", "Patient not found.", 404);
    }

    return patient;
  }

  public async setStatus(user: AuthenticatedRequestUser, id: string, isActive: boolean): Promise<Patient> {
    const patient = await this.patientsRepository.setActiveInClinic(user.clinicId, id, isActive);
    if (!patient) {
      throw new AppError("patients.not_found", "Paciente não encontrado.", 404);
    }

    return patient;
  }
}
