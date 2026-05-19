import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { ConfirmationService, MessageService } from 'primeng/api';
import { User, UserRole, ALL_ROLES, ROLE_LABELS } from '../../../core/domain/models/user.model';
import { ManageUsersUseCase } from '../../../core/application/use-cases/manage-users.use-case';
import { AuthStore } from '../../../core/application/auth.store';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [Button, Dialog, Select, InputText, Password, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private useCase = inject(ManageUsersUseCase);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  readonly authStore = inject(AuthStore);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly dialogVisible = signal(false);
  readonly saving = signal(false);

  editingId: string | null = null;
  formName = '';
  formRole: UserRole = 'cajero';
  formPin = '';
  formPinConfirm = '';

  readonly roleOptions = ALL_ROLES.map(r => ({ label: ROLE_LABELS[r], value: r }));

  roleLabel(role: UserRole): string { return ROLE_LABELS[role] ?? role; }

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading.set(true);
    try { this.users.set(await this.useCase.getAll()); }
    finally { this.loading.set(false); }
  }

  openCreate() {
    this.editingId = null;
    this.formName = '';
    this.formRole = 'cajero';
    this.formPin = '';
    this.formPinConfirm = '';
    this.dialogVisible.set(true);
  }

  openEdit(user: User) {
    this.editingId = user.id;
    this.formName = user.name;
    this.formRole = user.role;
    this.formPin = '';
    this.formPinConfirm = '';
    this.dialogVisible.set(true);
  }

  async save() {
    if (!this.formName.trim()) return;
    if (!this.editingId && !this.formPin) {
      this.messageService.add({ severity: 'warn', summary: 'PIN requerido', detail: 'Ingresa un PIN para el nuevo usuario.', life: 4000 });
      return;
    }
    if (this.formPin && this.formPin !== this.formPinConfirm) {
      this.messageService.add({ severity: 'warn', summary: 'PINs no coinciden', detail: 'Los PINs ingresados no son iguales.', life: 4000 });
      return;
    }
    this.saving.set(true);
    try {
      if (this.editingId) {
        await this.useCase.update(this.editingId, this.formName.trim(), this.formRole, this.formPin || undefined);
        this.messageService.add({ severity: 'success', summary: 'Usuario actualizado', life: 3000 });
      } else {
        await this.useCase.create(this.formName.trim(), this.formRole, this.formPin);
        this.messageService.add({ severity: 'success', summary: 'Usuario creado', life: 3000 });
      }
      this.dialogVisible.set(false);
      await this.load();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el usuario.', life: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(user: User) {
    if (user.id === this.authStore.currentUser()?.id) {
      this.messageService.add({ severity: 'warn', summary: 'Acción no permitida', detail: 'No puedes eliminar tu propio usuario.', life: 4000 });
      return;
    }
    this.confirmationService.confirm({
      message: `¿Eliminar al usuario "${user.name}"? Esta acción no se puede deshacer.`,
      header: 'Eliminar usuario',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.useCase.delete(user.id);
          await this.load();
        } catch {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario.', life: 5000 });
        }
      },
    });
  }
}
