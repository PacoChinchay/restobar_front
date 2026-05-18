import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Product, ProductCategory } from '../../../core/domain/models/product.model';
import { GetProductsUseCase } from '../../../core/application/use-cases/get-products.use-case';
import { CreateProductUseCase } from '../../../core/application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../../core/application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../../core/application/use-cases/delete-product.use-case';
import { AuthStore } from '../../../core/application/auth.store';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [Button, Divider, Dialog, InputText, InputNumber, Select, FormsModule, DecimalPipe],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private getProducts = inject(GetProductsUseCase);
  private createProduct = inject(CreateProductUseCase);
  private updateProduct = inject(UpdateProductUseCase);
  private deleteProduct = inject(DeleteProductUseCase);
  private authStore = inject(AuthStore);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  readonly products = signal<Product[]>([]);
  readonly saving = signal(false);
  readonly editingProduct = signal<Product | null>(null);
  readonly isAdmin = computed(() => this.authStore.currentUser()?.role === 'admin');
  readonly dialogTitle = computed(() => this.editingProduct() ? 'Editar producto' : 'Nuevo producto');

  readonly categories = computed(() => [...new Set(this.products().map(p => p.category))]);

  readonly productsByCategory = computed(() => {
    const map: Record<string, Product[]> = {};
    for (const cat of this.categories()) {
      map[cat] = this.products().filter(p => p.category === cat);
    }
    return map;
  });

  readonly categoryOptions = [
    { label: 'Platos',  value: 'Platos'  as ProductCategory },
    { label: 'Bebidas', value: 'Bebidas' as ProductCategory },
    { label: 'Postres', value: 'Postres' as ProductCategory },
  ];

  dialogVisible = false;
  newName = '';
  newPrice: number | null = null;
  newCategory: ProductCategory = 'Platos';

  async ngOnInit() {
    this.products.set(await this.getProducts.execute());
  }

  openDialog() {
    this.editingProduct.set(null);
    this.dialogVisible = true;
  }

  openEditDialog(product: Product) {
    this.editingProduct.set(product);
    this.newName = product.name;
    this.newPrice = product.price;
    this.newCategory = product.category;
    this.dialogVisible = true;
  }

  closeDialog() {
    this.dialogVisible = false;
  }

  resetForm() {
    this.editingProduct.set(null);
    this.newName = '';
    this.newPrice = null;
    this.newCategory = 'Platos';
  }

  confirmDelete(product: Product) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar "${product.name}"?`,
      header: 'Eliminar producto',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.doDelete(product),
    });
  }

  private async doDelete(product: Product) {
    try {
      await this.deleteProduct.execute(product.id);
      this.products.update(list => list.filter(p => p.id !== product.id));
      this.messageService.add({
        severity: 'success',
        summary: 'Producto eliminado',
        detail: `${product.name} eliminado del catálogo.`,
        life: 3000,
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el producto.',
        life: 4000,
      });
    }
  }

  async saveProduct() {
    if (!this.newName.trim() || !this.newPrice || this.newPrice <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Completa el nombre y un precio válido.',
        life: 3000,
      });
      return;
    }

    this.saving.set(true);
    const editing = this.editingProduct();
    try {
      const data = { name: this.newName.trim(), price: this.newPrice, category: this.newCategory };

      if (editing) {
        const updated = await this.updateProduct.execute(editing.id, data);
        this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
        this.messageService.add({
          severity: 'success',
          summary: 'Producto actualizado',
          detail: `${updated.name} actualizado correctamente.`,
          life: 3000,
        });
      } else {
        const created = await this.createProduct.execute(data);
        this.products.update(list => [...list, created]);
        this.messageService.add({
          severity: 'success',
          summary: 'Producto creado',
          detail: `${created.name} agregado al catálogo.`,
          life: 3000,
        });
      }

      this.closeDialog();
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: editing ? 'No se pudo actualizar el producto.' : 'No se pudo crear el producto.',
        life: 4000,
      });
    } finally {
      this.saving.set(false);
    }
  }
}
