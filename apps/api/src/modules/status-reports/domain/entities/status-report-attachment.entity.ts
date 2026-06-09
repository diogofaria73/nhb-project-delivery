import { BaseEntity } from '@shared/domain/base.entity';

export interface AttachmentProps {
  id?: string;
  submissionId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  uploadedAt?: Date;
}

export class StatusReportAttachment extends BaseEntity {
  private readonly _submissionId: string;
  private readonly _filename: string;
  private readonly _mimeType: string;
  private readonly _sizeBytes: number;
  private readonly _storageKey: string;
  private readonly _uploadedAt: Date;

  constructor(props: AttachmentProps) {
    super(props.id);
    this._submissionId = props.submissionId;
    this._filename = props.filename;
    this._mimeType = props.mimeType;
    this._sizeBytes = props.sizeBytes;
    this._storageKey = props.storageKey;
    this._uploadedAt = props.uploadedAt ?? new Date();
  }

  get submissionId(): string {
    return this._submissionId;
  }
  get filename(): string {
    return this._filename;
  }
  get mimeType(): string {
    return this._mimeType;
  }
  get sizeBytes(): number {
    return this._sizeBytes;
  }
  get storageKey(): string {
    return this._storageKey;
  }
  get uploadedAt(): Date {
    return this._uploadedAt;
  }
}
