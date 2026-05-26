import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MenuModel, MenuItemModel, MenuType } from '../../../core/domain/models/menu.model';
import { Category } from '../../../core/domain/models/category.model';
import { ManageMenusUseCase } from '../../../core/application/use-cases/manage-menus.use-case';
import { GetProductsUseCase } from '../../../core/application/use-cases/get-products.use-case';
import { GetCategoriesUseCase } from '../../../core/application/use-cases/get-categories.use-case';
import { Product } from '../../../core/domain/models/product.model';

interface EditorItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

const TYPE_LABELS: Record<MenuType, string> = {
  daily: 'Menú del día',
  food:  'Carta',
  drinks: 'Carta de bebidas',
};

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [Button, InputText, FormsModule, DecimalPipe],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.scss',
})
export class MenusComponent implements OnInit {
  private useCase = inject(ManageMenusUseCase);
  private getProducts = inject(GetProductsUseCase);
  private getCategories = inject(GetCategoriesUseCase);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  readonly TYPE_LABELS = TYPE_LABELS;
  readonly tabs: MenuType[] = ['daily', 'food', 'drinks'];

  // ── List state ────────────────────────────────────────────────────────────
  readonly menus = signal<MenuModel[]>([]);
  readonly loading = signal(false);
  readonly activeTab = signal<MenuType>('daily');

  readonly displayedMenus = computed(() =>
    this.menus().filter(m => m.type === this.activeTab()),
  );

  // ── Editor state ──────────────────────────────────────────────────────────
  readonly editorOpen = signal(false);
  readonly editorType = signal<MenuType>('daily');
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);

  editorName = '';
  readonly editorItems = signal<EditorItem[]>([]);

  // Catalog for editor
  readonly allProducts = signal<Product[]>([]);
  readonly allCategories = signal<Category[]>([]);
  readonly selectedCategory = signal('');

  /** Categories visible in the editor depending on type */
  readonly editorCategories = computed(() => {
    const type = this.editorType();
    const cats = this.allCategories();
    if (type === 'drinks') return cats.filter(c => c.isDrink).map(c => c.name);
    if (type === 'food')   return cats.filter(c => !c.isDrink).map(c => c.name);
    return cats.map(c => c.name);
  });

  /** Products visible in the editor (type-filtered + category-filtered) */
  readonly filteredProducts = computed(() => {
    const type = this.editorType();
    const cat = this.selectedCategory();
    const drinkCatNames = new Set(
      this.allCategories().filter(c => c.isDrink).map(c => c.name),
    );
    let prods = this.allProducts();
    if (type === 'drinks') prods = prods.filter(p => drinkCatNames.has(p.category));
    if (type === 'food')   prods = prods.filter(p => !drinkCatNames.has(p.category));
    return cat ? prods.filter(p => p.category === cat) : prods;
  });

  readonly editorTitle = computed(() => {
    const label = TYPE_LABELS[this.editorType()];
    return this.editingId() ? `Editar ${label.toLowerCase()}` : `Nueva ${label.toLowerCase()}`;
  });

  readonly selectedPanelTitle = computed(() => {
    const type = this.editorType();
    if (type === 'drinks') return 'Bebidas seleccionadas';
    if (type === 'food')   return 'Platos de la carta';
    return 'Platos del menú';
  });

  // ── Inline quantity editing for active menu ───────────────────────────────
  readonly editingQtyItemId = signal<number | null>(null);
  editingQtyValue = 0;

  async ngOnInit() {
    await this.loadMenus();
  }

  async loadMenus() {
    this.loading.set(true);
    try { this.menus.set(await this.useCase.getAll()); }
    finally { this.loading.set(false); }
  }

  selectTab(tab: MenuType) {
    this.activeTab.set(tab);
  }

  // ── Editor open/close ─────────────────────────────────────────────────────
  async openCreate() {
    await this.loadCatalog();
    this.editorType.set(this.activeTab());
    this.editingId.set(null);
    this.editorName = '';
    this.editorItems.set([]);
    this.syncEditorCategory();
    this.editorOpen.set(true);
  }

  async openEdit(menu: MenuModel) {
    await this.loadCatalog();
    this.editorType.set(menu.type);
    this.editingId.set(menu.id);
    this.editorName = menu.name;
    this.editorItems.set(menu.items.map(i => ({
      productId: i.productId,
      productName: i.productName,
      unitPrice: i.unitPrice,
      quantity: i.remainingQuantity,
    })));
    this.syncEditorCategory();
    this.editorOpen.set(true);
  }

  closeEditor() {
    this.editorOpen.set(false);
  }

  private syncEditorCategory() {
    const cats = this.editorCategories();
    this.selectedCategory.set(cats.length ? cats[0] : '');
  }

  private async loadCatalog() {
    if (this.allProducts().length) return;
    const [prods, cats] = await Promise.all([
      this.getProducts.execute(),
      this.getCategories.execute(),
    ]);
    this.allProducts.set(prods.filter(p => p.active));
    this.allCategories.set(cats);
  }

  selectCategory(cat: string) { this.selectedCategory.set(cat); }

  addProduct(product: Product) {
    const existing = this.editorItems().find(i => i.productId === product.id);
    if (existing) {
      this.editorItems.update(items =>
        items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i),
      );
    } else {
      this.editorItems.update(items => [...items, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
      }]);
    }
  }

  increaseQty(item: EditorItem) {
    this.editorItems.update(items =>
      items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i),
    );
  }

  decreaseQty(item: EditorItem) {
    if (item.quantity <= 1) {
      this.removeItem(item);
    } else {
      this.editorItems.update(items =>
        items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity - 1 } : i),
      );
    }
  }

  removeItem(item: EditorItem) {
    this.editorItems.update(items => items.filter(i => i.productId !== item.productId));
  }

  itemQty(productId: number): number {
    return this.editorItems().find(i => i.productId === productId)?.quantity ?? 0;
  }

  async save() {
    if (!this.editorName.trim() || this.editorItems().length === 0 || this.saving()) return;
    this.saving.set(true);
    try {
      const request = {
        name: this.editorName.trim(),
        type: this.editorType(),
        items: this.editorItems().map(i => ({
          productId: i.productId,
          productName: i.productName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      };
      const id = this.editingId();
      const label = TYPE_LABELS[this.editorType()];
      if (id) {
        await this.useCase.update(id, request);
        this.messageService.add({ severity: 'success', summary: `${label} actualizada`, life: 3000 });
      } else {
        await this.useCase.create(request);
        this.messageService.add({ severity: 'success', summary: `${label} creada`, life: 3000 });
      }
      this.editorOpen.set(false);
      await this.loadMenus();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.', life: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  // ── Activate / Deactivate ─────────────────────────────────────────────────
  async toggleActive(menu: MenuModel) {
    try {
      if (menu.isActive) {
        await this.useCase.deactivate(menu.id);
      } else {
        await this.useCase.activate(menu.id);
      }
      await this.loadMenus();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.', life: 4000 });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(menu: MenuModel) {
    const label = TYPE_LABELS[menu.type].toLowerCase();
    this.confirmationService.confirm({
      message: `¿Eliminar la ${label} "${menu.name}"? Esta acción no se puede deshacer.`,
      header: `Eliminar ${label}`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.useCase.delete(menu.id);
          await this.loadMenus();
          this.messageService.add({ severity: 'success', summary: 'Eliminado', life: 3000 });
        } catch {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.', life: 4000 });
        }
      },
    });
  }

  // ── Inline remaining quantity edit (admin adjustment) ─────────────────────
  startEditQty(item: MenuItemModel) {
    this.editingQtyItemId.set(item.id);
    this.editingQtyValue = item.remainingQuantity;
  }

  async saveQty(menu: MenuModel, item: MenuItemModel) {
    try {
      const updated = await this.useCase.updateItemQuantity(menu.id, item.id, this.editingQtyValue);
      this.menus.update(list => list.map(m => m.id === menu.id ? updated : m));
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la cantidad.', life: 4000 });
    } finally {
      this.editingQtyItemId.set(null);
    }
  }

  cancelEditQty() { this.editingQtyItemId.set(null); }
}
