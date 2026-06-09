import { BaseEntity } from '@shared/domain/base.entity';
import { Cnpj } from '../value-objects/cnpj.vo';

export interface CompanyProps {
  id?: string;
  tradeName: string;
  legalName: string;
  cnpj: Cnpj;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Company extends BaseEntity {
  private _tradeName: string;
  private _legalName: string;
  private readonly _cnpj: Cnpj;
  private _contactEmail: string;
  private _contactPhone: string | null;
  private _notes: string | null;
  private _isActive: boolean;

  constructor(props: CompanyProps) {
    super(props.id);
    this._tradeName = props.tradeName;
    this._legalName = props.legalName;
    this._cnpj = props.cnpj;
    this._contactEmail = props.contactEmail;
    this._contactPhone = props.contactPhone ?? null;
    this._notes = props.notes ?? null;
    this._isActive = props.isActive ?? true;
  }

  get tradeName(): string {
    return this._tradeName;
  }

  get legalName(): string {
    return this._legalName;
  }

  get cnpj(): Cnpj {
    return this._cnpj;
  }

  get contactEmail(): string {
    return this._contactEmail;
  }

  get contactPhone(): string | null {
    return this._contactPhone;
  }

  get notes(): string | null {
    return this._notes;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  updateTradeName(value: string): void {
    this._tradeName = value;
    this.touch();
  }

  updateLegalName(value: string): void {
    this._legalName = value;
    this.touch();
  }

  updateContactEmail(value: string): void {
    this._contactEmail = value;
    this.touch();
  }

  updateContactPhone(value: string | null): void {
    this._contactPhone = value;
    this.touch();
  }

  updateNotes(value: string | null): void {
    this._notes = value;
    this.touch();
  }

  activate(): void {
    this._isActive = true;
    this.touch();
  }

  deactivate(): void {
    this._isActive = false;
    this.touch();
  }
}
