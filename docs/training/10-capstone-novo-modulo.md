# 10 — Capstone: criar o módulo `notifications`

Você vai criar um módulo novo **ponta a ponta** — banco, backend, contratos, frontend, rotas, i18n — usando tudo dos capítulos 02-09.

Não é trabalho fictício: é **exatamente** o que você faria recebendo a tarefa real. Reserve **2-3 horas** sem interrupção.

---

## O que vamos construir

**Feature:** `notifications` — avisos internos exibidos no header para todos usuários autenticados.

### Regras de negócio (mini-spec)

- **NOT-01:** Administradores podem **criar** notificações (título + mensagem + severity)
- **NOT-02:** Severity é `INFO` | `WARNING` | `CRITICAL`
- **NOT-03:** Toda notificação tem `createdAt` e `dismissedAt?` por usuário (cada usuário "dismissa" individualmente)
- **NOT-04:** Frontend mostra um sininho no header com contagem de notificações **não dismissed**
- **NOT-05:** Clicando, abre uma dropdown listando as últimas 20
- **NOT-06:** Cada item tem botão "Dismiss" — chama API, some da lista, decrementa contador
- **NOT-07:** Apenas ADMIN pode acessar a tela `/notifications/admin` para criar/listar todas

### Endpoints (planejados)

| Método | Rota | Quem | O que faz |
| --- | --- | --- | --- |
| `POST` | `/api/notifications` | ADMIN | Cria notificação |
| `GET` | `/api/notifications` | ADMIN | Lista todas (paginado) |
| `GET` | `/api/notifications/inbox` | autenticado | Notificações ativas pro usuário (não dismissed) |
| `POST` | `/api/notifications/:id/dismiss` | autenticado | Dismissa para o usuário corrente |
| `DELETE` | `/api/notifications/:id` | ADMIN | Apaga a notificação |

---

## Passo 1 — Schema Prisma

Edite `apps/api/prisma/schema.prisma`:

```prisma
enum NotificationSeverity {
  INFO
  WARNING
  CRITICAL
}

model Notification {
  id        String               @id @default(uuid())
  title     String
  message   String
  severity  NotificationSeverity @default(INFO)
  createdById String             @map("created_by_id")
  createdAt DateTime             @default(now()) @map("created_at")

  createdBy User                     @relation("NotificationCreatedBy", fields: [createdById], references: [id])
  dismissals NotificationDismissal[]

  @@index([createdAt])
  @@map("notifications")
}

model NotificationDismissal {
  id             String   @id @default(uuid())
  notificationId String   @map("notification_id")
  userId         String   @map("user_id")
  dismissedAt    DateTime @default(now()) @map("dismissed_at")

  notification Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  user         User         @relation("NotificationDismissedBy", fields: [userId], references: [id])

  @@unique([notificationId, userId])
  @@index([userId])
  @@map("notification_dismissals")
}
```

E adicione as relações inversas no model `User`:

```prisma
model User {
  // ... campos existentes
  notificationsCreated   Notification[]          @relation("NotificationCreatedBy")
  notificationsDismissed NotificationDismissal[] @relation("NotificationDismissedBy")
}
```

Gere e aplique:

```bash
pnpm --filter @nhb-status-report/api prisma:migrate
# nome sugerido: add-notifications
```

> ✅ Confira em `apps/api/prisma/migrations/<ts>_add-notifications/migration.sql` se o SQL faz sentido. Espera-se `CREATE TABLE notifications`, `CREATE TABLE notification_dismissals`, índices.

---

## Passo 2 — Contratos compartilhados

Crie `packages/shared/src/types/notifications-contracts.ts`:

```typescript
export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;            // ISO
  createdById: string;
}

export interface NotificationInboxItemDto extends NotificationDto {
  dismissed: boolean;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  severity: NotificationSeverity;
}

export interface NotificationListResponseDto {
  items: NotificationDto[];
  total: number;
}
```

Re-exporte em `packages/shared/src/index.ts`:

```typescript
export * from './types/notifications-contracts';
```

Build:

```bash
pnpm --filter @nhb-status-report/shared build
```

---

## Passo 3 — Esqueleto do módulo backend

Crie a árvore (use o `project-tracking` como referência):

```
apps/api/src/modules/notifications/
├── domain/
│   ├── repositories/
│   │   └── notification.repository.ts
│   └── errors/
│       └── notification.errors.ts
├── application/
│   ├── dtos/
│   │   ├── create-notification.dto.ts
│   │   └── list-notifications.dto.ts
│   └── use-cases/
│       ├── create-notification.use-case.ts
│       ├── list-notifications.use-case.ts
│       ├── get-inbox.use-case.ts
│       ├── dismiss-notification.use-case.ts
│       ├── delete-notification.use-case.ts
│       └── index.ts
├── infrastructure/
│   └── repositories/
│       └── prisma-notification.repository.ts
├── presentation/
│   ├── controllers/
│   │   └── notifications.controller.ts
│   └── filters/
│       └── notifications-exception.filter.ts
└── notifications.module.ts
```

### 3.1 — Interface do repositório

`apps/api/src/modules/notifications/domain/repositories/notification.repository.ts`:

```typescript
import type { NotificationSeverity } from '@nhb-status-report/shared';

export const NOTIFICATION_REPOSITORY = 'INotificationRepository';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdById: string;
  createdAt: Date;
}

export interface InboxItem extends NotificationRecord {
  dismissed: boolean;
}

export interface INotificationRepository {
  create(input: Omit<NotificationRecord, 'id' | 'createdAt'>): Promise<NotificationRecord>;
  list(opts: { skip: number; take: number }): Promise<{ items: NotificationRecord[]; total: number }>;
  inbox(userId: string, limit: number): Promise<InboxItem[]>;
  dismiss(notificationId: string, userId: string): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<NotificationRecord | null>;
}
```

### 3.2 — Erros de domínio

`apps/api/src/modules/notifications/domain/errors/notification.errors.ts`:

```typescript
export class NotificationNotFoundError extends Error {
  constructor(id: string) {
    super(`Notification ${id} not found`);
  }
}
```

### 3.3 — DTOs de entrada

`apps/api/src/modules/notifications/application/dtos/create-notification.dto.ts`:

```typescript
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import type { NotificationSeverity } from '@nhb-status-report/shared';

export class CreateNotificationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  message: string;

  @IsIn(['INFO', 'WARNING', 'CRITICAL'])
  severity: NotificationSeverity;
}
```

`list-notifications.dto.ts`:

```typescript
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListNotificationsDto {
  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  skip?: number;

  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  take?: number;
}
```

### 3.4 — Use cases

Exemplo (`create-notification.use-case.ts`):

```typescript
import { Inject, Injectable } from '@nestjs/common';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/repositories/notification.repository';
import { CreateNotificationDto } from '../dtos/create-notification.dto';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repo: INotificationRepository,
  ) {}

  async execute(input: CreateNotificationDto & { createdById: string }) {
    const record = await this.repo.create({
      title: input.title,
      message: input.message,
      severity: input.severity,
      createdById: input.createdById,
    });
    return this.toDto(record);
  }

  private toDto(r: { id: string; title: string; message: string; severity: string; createdAt: Date; createdById: string }) {
    return {
      id: r.id,
      title: r.title,
      message: r.message,
      severity: r.severity as 'INFO' | 'WARNING' | 'CRITICAL',
      createdAt: r.createdAt.toISOString(),
      createdById: r.createdById,
    };
  }
}
```

Faça os outros use cases seguindo o mesmo padrão (`ListNotificationsUseCase`, `GetInboxUseCase`, `DismissNotificationUseCase`, `DeleteNotificationUseCase`).

`use-cases/index.ts`:

```typescript
export { CreateNotificationUseCase } from './create-notification.use-case';
export { ListNotificationsUseCase } from './list-notifications.use-case';
export { GetInboxUseCase } from './get-inbox.use-case';
export { DismissNotificationUseCase } from './dismiss-notification.use-case';
export { DeleteNotificationUseCase } from './delete-notification.use-case';
```

### 3.5 — Repositório Prisma

`apps/api/src/modules/notifications/infrastructure/repositories/prisma-notification.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  INotificationRepository,
  NotificationRecord,
  InboxItem,
} from '../../domain/repositories/notification.repository';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: Omit<NotificationRecord, 'id' | 'createdAt'>) {
    return this.prisma.notification.create({ data: input });
  }

  async list({ skip, take }: { skip: number; take: number }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        skip, take, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count(),
    ]);
    return { items, total };
  }

  async inbox(userId: string, limit: number): Promise<InboxItem[]> {
    const rows = await this.prisma.notification.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        dismissals: { where: { userId }, select: { id: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      severity: r.severity,
      createdById: r.createdById,
      createdAt: r.createdAt,
      dismissed: r.dismissals.length > 0,
    }));
  }

  async dismiss(notificationId: string, userId: string) {
    await this.prisma.notificationDismissal.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      create: { notificationId, userId },
      update: {},
    });
  }

  async delete(id: string) {
    await this.prisma.notification.delete({ where: { id } });
  }

  findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }
}
```

### 3.6 — Controller

`apps/api/src/modules/notifications/presentation/controllers/notifications.controller.ts`:

```typescript
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '@shared/infrastructure/decorators/current-user.decorator';
import { CreateNotificationDto } from '../../application/dtos/create-notification.dto';
import { ListNotificationsDto } from '../../application/dtos/list-notifications.dto';
import {
  CreateNotificationUseCase,
  DeleteNotificationUseCase,
  DismissNotificationUseCase,
  GetInboxUseCase,
  ListNotificationsUseCase,
} from '../../application/use-cases';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly create: CreateNotificationUseCase,
    private readonly list: ListNotificationsUseCase,
    private readonly inbox: GetInboxUseCase,
    private readonly dismiss: DismissNotificationUseCase,
    private readonly remove: DeleteNotificationUseCase,
  ) {}

  @Post()
  @Roles('ADMINISTRATOR')
  createOne(@Body() dto: CreateNotificationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.create.execute({ ...dto, createdById: user.userId });
  }

  @Get()
  @Roles('ADMINISTRATOR')
  listAll(@Query() q: ListNotificationsDto) {
    return this.list.execute({ skip: q.skip ?? 0, take: q.take ?? 20 });
  }

  @Get('inbox')
  inboxForUser(@CurrentUser() user: AuthenticatedUser) {
    return this.inbox.execute(user.userId);
  }

  @Post(':id/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  dismissOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dismiss.execute({ notificationId: id, userId: user.userId });
  }

  @Delete(':id')
  @Roles('ADMINISTRATOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.remove.execute(id);
  }
}
```

### 3.7 — Filter

`apps/api/src/modules/notifications/presentation/filters/notifications-exception.filter.ts`:

```typescript
import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { NotificationNotFoundError } from '../../domain/errors/notification.errors';

@Catch(NotificationNotFoundError)
export class NotificationsExceptionFilter implements ExceptionFilter {
  catch(exception: NotificationNotFoundError, host: ArgumentsHost) {
    throw new NotFoundException(exception.message);
  }
}
```

### 3.8 — Módulo

`apps/api/src/modules/notifications/notifications.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository';
import { PrismaNotificationRepository } from './infrastructure/repositories/prisma-notification.repository';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { NotificationsExceptionFilter } from './presentation/filters/notifications-exception.filter';
import {
  CreateNotificationUseCase,
  DeleteNotificationUseCase,
  DismissNotificationUseCase,
  GetInboxUseCase,
  ListNotificationsUseCase,
} from './application/use-cases';

@Module({
  controllers: [NotificationsController],
  providers: [
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    CreateNotificationUseCase,
    ListNotificationsUseCase,
    GetInboxUseCase,
    DismissNotificationUseCase,
    DeleteNotificationUseCase,
    { provide: APP_FILTER, useClass: NotificationsExceptionFilter },
  ],
})
export class NotificationsModule {}
```

### 3.9 — Registre no `app.module.ts`

```typescript
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // ... existentes
    NotificationsModule,
  ],
})
export class AppModule {}
```

Rode `pnpm dev:api`. Abra `http://localhost:3000/api/docs`. Confira: o grupo **Notifications** apareceu com 5 endpoints.

---

## Passo 4 — Frontend: service

Crie `apps/web/src/services/notifications.service.ts`:

```typescript
import { apiClient } from './api-client';
import type {
  CreateNotificationDto,
  NotificationDto,
  NotificationInboxItemDto,
  NotificationListResponseDto,
} from '@nhb-status-report/shared';

export const notificationsService = {
  create: (input: CreateNotificationDto) =>
    apiClient.post<NotificationDto>('/notifications', input),
  list: (skip = 0, take = 20) =>
    apiClient.get<NotificationListResponseDto>(`/notifications?skip=${skip}&take=${take}`),
  inbox: () =>
    apiClient.get<NotificationInboxItemDto[]>('/notifications/inbox'),
  dismiss: (id: string) =>
    apiClient.post<void>(`/notifications/${id}/dismiss`),
  remove: (id: string) =>
    apiClient.delete<void>(`/notifications/${id}`),
};
```

---

## Passo 5 — Frontend: feature

Crie a árvore:

```
apps/web/src/features/notifications/
├── components/
│   ├── notification-bell.tsx            sininho no header
│   ├── notification-dropdown.tsx        lista no popover
│   └── notification-admin-form.tsx      formulário admin
├── hooks/
│   ├── use-notification-inbox.ts        fetch + dismiss
│   └── use-notification-admin.ts        create + list + delete
├── pages/
│   └── notifications-admin-page.tsx     /notifications/admin
└── index.ts
```

Sketch dos arquivos principais:

### `hooks/use-notification-inbox.ts`

```typescript
import { useEffect, useState, useCallback } from 'react';
import { notificationsService } from '@/services/notifications.service';
import type { NotificationInboxItemDto } from '@nhb-status-report/shared';

export function useNotificationInbox() {
  const [items, setItems] = useState<NotificationInboxItemDto[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await notificationsService.inbox());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const dismiss = useCallback(async (id: string) => {
    await notificationsService.dismiss(id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, dismissed: true } : n));
  }, []);

  const unreadCount = items.filter((n) => !n.dismissed).length;
  return { items, unreadCount, loading, refresh, dismiss };
}
```

### `components/notification-bell.tsx`

```tsx
import { Bell } from 'lucide-react';
import { useNotificationInbox } from '../hooks/use-notification-inbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationDropdown } from './notification-dropdown';

export function NotificationBell() {
  const { items, unreadCount, dismiss } = useNotificationInbox();
  return (
    <Popover>
      <PopoverTrigger className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-xs px-1.5">
            {unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <NotificationDropdown items={items} onDismiss={dismiss} />
      </PopoverContent>
    </Popover>
  );
}
```

### `index.ts`

```typescript
export { NotificationBell } from './components/notification-bell';
export { NotificationsAdminPage } from './pages/notifications-admin-page';
```

### Adicione no `AdminLayout` (header)

No componente do header do `AdminLayout`, monte o `<NotificationBell />` ao lado do avatar.

### Adicione a rota admin

`apps/web/src/app/App.tsx`:

```tsx
import { NotificationsAdminPage } from '@/features/notifications';

// dentro do AdminLayout:
<Route
  path="/notifications/admin"
  element={
    <RoleGuard allowedRoles={['ADMINISTRATOR']}>
      <NotificationsAdminPage />
    </RoleGuard>
  }
/>
```

---

## Passo 6 — i18n

`apps/web/src/i18n/locales/pt-BR.ts` (adicione):

```typescript
notifications: {
  bell: { tooltip: 'Notificações' },
  empty: 'Nenhuma notificação',
  dismiss: 'Descartar',
  admin: {
    title: 'Notificações (Admin)',
    create: 'Nova notificação',
    fields: { title: 'Título', message: 'Mensagem', severity: 'Severidade' },
    severity: { INFO: 'Informação', WARNING: 'Atenção', CRITICAL: 'Crítica' },
  },
},
```

E o equivalente em `en.ts`. **Não deixe assimétrico** entre os dois arquivos.

---

## Passo 7 — Verificação manual

```bash
# Garante que dev tá rodando
pnpm dev
```

Checklist:

- [ ] Logue como admin. Abra `/notifications/admin`. Crie uma notificação `INFO`.
- [ ] Olhe o sininho no header — apareceu badge "1"?
- [ ] Abra o dropdown — vê a notificação?
- [ ] Clique "Dismiss" — sumiu da lista, badge zerou?
- [ ] Logue com **outro usuário** (crie um pelo `/users`). Veja se a notificação aparece para ele também (deve, porque a dismissal é por usuário).
- [ ] Como usuário comum, tente acessar `/notifications/admin` — deve cair em "sem permissão" / redirect.
- [ ] Como usuário comum, tente `POST /api/notifications` via curl/insomnia — deve receber **403** mesmo com token válido (defesa do backend).

---

## Passo 8 — Commit, push, PR

Siga o fluxo do capítulo 08:

```bash
git switch -c feature/notifications-module
git add ...
git commit -m "feat(notifications): add inline notifications with admin CRUD and per-user dismissal"
git push -u origin feature/notifications-module
```

PR description sugestiva:

```markdown
## Summary
- Adiciona módulo `notifications` (backend DDD + frontend feature) com avisos no header
- Admin CRUD em `/notifications/admin`, dismissal individual por usuário
- Migration `add-notifications` cria tabelas `notifications` e `notification_dismissals`

## Why
Capstone do treinamento. Demonstra arquitetura DDD ponta a ponta seguindo o padrão `project-tracking`.

## Test plan
- [x] Criar notificação como admin
- [x] Ver no header dois usuários diferentes
- [x] Dismissal independente entre usuários
- [x] User comum não acessa rota /admin
- [x] Backend rejeita POST sem role ADMINISTRATOR
```

Rode `/code-review` antes de pedir review humano.

---

## Critérios de pronto do capstone

Você completou o capstone se:

- [ ] `pnpm --filter @nhb-status-report/api test` passa
- [ ] `pnpm lint` passa sem warnings
- [ ] Swagger lista os 5 endpoints na tag `Notifications`
- [ ] Sininho com badge funcional no header
- [ ] Defesa em profundidade: backend bloqueia user comum mesmo se o frontend deixar
- [ ] Migration commitada junto com schema
- [ ] Strings i18n adicionadas em **ambos** locales

---

## E depois?

Você agora consegue:

1. Pegar um spec novo de `docs/specs/` e mapear mentalmente: schema → repository → use case → controller → service → hook → page
2. Discutir trade-offs de arquitetura (ex.: "isso pertence ao domínio ou à infrastructure?")
3. Revisar PRs de outros devs apontando os anti-padrões dos capítulos 03 e 08
4. Onboardar **outros juniores** usando este tutorial

Próximos passos sugeridos:

- Leia as USs ainda não tocadas em `docs/specs/`
- Pegue um bug aberto (issue/ticket) e implemente seguindo o fluxo
- Sugira melhorias deste tutorial via PR — manter material vivo é responsabilidade do time

---

**Parabéns. Você terminou a trilha.** 🎓
