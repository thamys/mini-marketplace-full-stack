'use client';

import { Suspense, useState } from 'react';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, deleteProduct, Product, createProduct, updateProduct } from '@/lib/api/products';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Badge } from '@/components/ui/badge';
import { ProductModal } from '@/components/admin/ProductModal';
import { ProductFormData } from '@/components/admin/ProductForm';
import { toast } from 'sonner';
import { AdminTableSkeleton } from '@/components/skeletons/admin-table-skeleton';

const COLUMNS = ['Imagem', 'Nome', 'Categoria', 'Preço', 'Estoque', 'Ações'];

interface ProductsTableContentProps {
  page: number;
  search: string;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  onPageChange: (page: number) => void;
}

function ProductsTableContent({ page, search, onEdit, onDelete, onPageChange }: ProductsTableContentProps) {
  const { data } = useSuspenseQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => getProducts({ page, limit: 10, search }),
  });

  return (
    <>
      <div className="rounded-xl border bg-card shadow-md overflow-hidden transition-all duration-300">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-1">
                    <Search className="h-8 w-8 opacity-20 mb-2" />
                    Nenhum produto encontrado.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/30 transition-colors group">
                  <TableCell>
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-muted shadow-sm group-hover:scale-105 transition-transform">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground font-medium uppercase px-1 text-center">
                          S/ Img
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex flex-col">
                      <span className="text-base line-clamp-1">{product.name}</span>
                      <span className="text-xs text-muted-foreground font-normal line-clamp-1 max-w-[300px]">
                        {product.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(product.price))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock <= 5 ? "destructive" : "outline"} className="font-bold">
                      {product.stock} un
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-9 w-9 p-0 hover:bg-muted focus:ring-1 focus:ring-primary rounded-lg transition-all inline-flex items-center justify-center cursor-pointer">
                        <MoreHorizontal className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px] animate-in slide-in-from-top-1 duration-200">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(product)} className="cursor-pointer gap-2">
                          <Pencil className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                          onClick={() => onDelete(product.id, product.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            Mostrando <span className="text-foreground">{(page - 1) * 10 + 1}</span> a{' '}
            <span className="text-foreground">
              {Math.min(page * 10, data.meta.total)}
            </span>{' '}
            de <span className="text-foreground">{data.meta.total}</span> produtos
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-6 h-10 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(data.meta.totalPages, page + 1))}
              disabled={page === data.meta.totalPages}
              className="px-6 h-10 hover:bg-muted"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newData: ProductFormData) => createProduct(newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsModalOpen(false);
      toast.success('Produto criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar produto.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsModalOpen(false);
      toast.success('Produto atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar produto.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir produto.');
    },
  });

  const handleCreate = () => {
    setSelectedProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: ProductFormData) => {
    if (selectedProduct) {
      await updateMutation.mutateAsync({ id: selectedProduct.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setProductToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteMutation.mutateAsync(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="admin-title">Gerenciamento de Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Adicione, edite ou remova produtos do catálogo.
          </p>
        </div>
        <Button className="gap-2 shadow-sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Pesquisar produtos..."
            className="pl-10 shadow-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Suspense fallback={<AdminTableSkeleton columns={COLUMNS} />}>
        <ProductsTableContent
          page={page}
          search={search}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPageChange={setPage}
        />
      </Suspense>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto
              <span className="font-semibold text-foreground"> &quot;{productToDelete?.name}&quot;</span> do catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
