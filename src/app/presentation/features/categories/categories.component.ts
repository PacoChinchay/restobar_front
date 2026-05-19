import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Divider } from 'primeng/divider';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Category } from '../../../core/domain/models/category.model';
import { GetCategoriesUseCase } from '../../../core/application/use-cases/get-categories.use-case';
import { CreateCategoryUseCase } from '../../../core/application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../../core/application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../../core/application/use-cases/delete-category.use-case';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [Button, Dialog, InputText, Divider, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  private getCategories = inject(GetCategoriesUseCase);
  private createCategory = inject(CreateCategoryUseCase);
  private updateCategory = inject(UpdateCategoryUseCase);
  private deleteCategory = inject(DeleteCategoryUseCase);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  readonly categories = signal<Category[]>([]);
  readonly saving = signal(false);
  readonly editingCategory = signal<Category | null>(null);

  dialogVisible = false;
  newName = '';

  get dialogTitle() {
    return this.editingCategory() ? 'Editar categoría' : 'Nueva categoría';
  }

  async ngOnInit() {
    this.categories.set(await this.getCategories.execute());
  }

  openDialog() {
    this.editingCategory.set(null);
    this.newName = '';
    this.dialogVisible = true;
  }

  openEditDialog(category: Category) {
    this.editingCategory.set(category);
    this.newName = category.name;
    this.dialogVisible = true;
  }

  closeDialog() {
    this.dialogVisible = false;
  }

  resetForm() {
    this.editingCategory.set(null);
    this.newName = '';
  }

  confirmDelete(category: Category) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar "${category.name}"?`,
      header: 'Eliminar categoría',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.doDelete(category),
    });
  }

  private async doDelete(category: Category) {
    try {
      await this.deleteCategory.execute(category.id);
      this.categories.update(list => list.filter(c => c.id !== category.id));
      this.messageService.add({
        severity: 'success',
        summary: 'Categoría eliminada',
        detail: `"${category.name}" eliminada correctamente.`,
        life: 3000,
      });
    } catch (err: any) {
      const detail = err?.error?.message ?? 'No se pudo eliminar la categoría.';
      this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
    }
  }

  async saveCategory() {
    if (!this.newName.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Ingresa un nombre para la categoría.',
        life: 3000,
      });
      return;
    }

    this.saving.set(true);
    const editing = this.editingCategory();
    try {
      if (editing) {
        const updated = await this.updateCategory.execute(editing.id, this.newName.trim());
        this.categories.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.messageService.add({
          severity: 'success', summary: 'Categoría actualizada',
          detail: `"${updated.name}" actualizada correctamente.`, life: 3000,
        });
      } else {
        const created = await this.createCategory.execute(this.newName.trim());
        this.categories.update(list => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
        this.messageService.add({
          severity: 'success', summary: 'Categoría creada',
          detail: `"${created.name}" agregada correctamente.`, life: 3000,
        });
      }
      this.closeDialog();
    } catch (err: any) {
      const detail = err?.error?.message ?? (editing ? 'No se pudo actualizar la categoría.' : 'No se pudo crear la categoría.');
      this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
    } finally {
      this.saving.set(false);
    }
  }
}
