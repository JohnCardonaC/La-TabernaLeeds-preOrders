"use client";

import { useState, useEffect } from 'react';
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
};

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        setError('Error loading menu items.');
        console.error(error);
      } else {
        const categoryOrder = ['Starters', 'Vegetables', 'Meat', 'Fish'];
        const sortedData = (data || []).sort((a, b) => {
          const aIndex = categoryOrder.indexOf(a.category);
          const bIndex = categoryOrder.indexOf(b.category);
          if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setMenuItems(sortedData);
      }
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [supabase, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item: MenuItem) => {
    setIsEditMode(true);
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', item.id);

    if (error) {
      console.error('Error deleting menu item:', error);
      alert('Error deleting menu item.');
    } else {
      setMenuItems(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, description, price, category } = formData;
    const numericPrice = parseFloat(price);

    if (!name || !price || !category || isNaN(numericPrice)) {
      alert('Please fill all required fields with valid data.');
      return;
    }

    if (isEditMode && editingItem) {
      // Update
      const { error } = await supabase
        .from('menus')
        .update({ name, description: description || null, price: numericPrice, category })
        .eq('id', editingItem.id);

      if (error) {
        console.error('Error updating menu item:', error);
        alert('Error updating menu item.');
      } else {
        // Refresh the list
        const { data } = await supabase
          .from('menus')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });
        const categoryOrder = ['Starters', 'Vegetables', 'Meat', 'Fish'];
        const sortedData = (data || []).sort((a, b) => {
          const aIndex = categoryOrder.indexOf(a.category);
          const bIndex = categoryOrder.indexOf(b.category);
          if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setMenuItems(sortedData);
        setFormData({ name: '', description: '', price: '', category: '' });
        setIsEditMode(false);
        setEditingItem(null);
        setIsDialogOpen(false);
      }
    } else {
      // Create
      const { error } = await supabase
        .from('menus')
        .insert([{ name, description: description || null, price: numericPrice, category }]);

      if (error) {
        console.error('Error adding menu item:', error);
        alert('Error adding menu item.');
      } else {
        // Refresh the list
        const { data } = await supabase
          .from('menus')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });
        const categoryOrder = ['Starters', 'Vegetables', 'Meat', 'Fish'];
        const sortedData = (data || []).sort((a, b) => {
          const aIndex = categoryOrder.indexOf(a.category);
          const bIndex = categoryOrder.indexOf(b.category);
          if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setMenuItems(sortedData);
        setFormData({ name: '', description: '', price: '', category: '' });
        setIsDialogOpen(false);
      }
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setIsEditMode(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', category: '' });
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="menu">
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPage="menu">
        <p className="text-red-500">{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="menu">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Menu Items</h2>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>Create Menu Item</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Update the details for the menu item.' : 'Fill in the details for the new menu item.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{isEditMode ? 'Update Item' : 'Add Item'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="hidden md:block border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.length > 0 ? (
              menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.description || '-'}</TableCell>
                  <TableCell className="text-right">£{item.price.toFixed(2)}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  No menu items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-4">
        {menuItems.length > 0 ? (
          menuItems.map((item) => (
            <Card key={item.id} className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>Description:</strong> {item.description || '-'}</div>
                  <div><strong>Price:</strong> £{item.price.toFixed(2)}</div>
                  <div><strong>Category:</strong> {item.category}</div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500">No menu items found.</p>
        )}
      </div>
    </AdminLayout>
  );
}
