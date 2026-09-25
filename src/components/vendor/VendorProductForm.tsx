"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { FiArrowLeft, FiUpload, FiX } from "react-icons/fi";
import { useCategories } from "@/hooks/category/queries/useCategories";
import { useVendorProductMutation } from "@/hooks/vendor";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

interface ImagePreview {
  file?: File;
  preview: string;
  id: string;
  isExisting?: boolean;
}

interface VendorProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialProduct?: any;
}

// A deliberately small, vendor-only product form — the admin catalog form
// (SimpleProductForm) is 2000+ lines of admin-specific tooling (PDF import,
// JSON import, bulk pricing tiers, full variant system) that a vendor
// neither needs nor should see. This covers exactly what a vendor supplies:
// catalog info + cost price. Pricing/publishing is superadmin-only (Phase 3/8).
export function VendorProductForm({ mode, productId, initialProduct }: VendorProductFormProps) {
  const router = useRouter();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { createAsync, updateAsync, isCreating, isUpdating } = useVendorProductMutation();

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription ?? "");
  const [category, setCategory] = useState(initialProduct?.category?._id ?? initialProduct?.category ?? "");
  const [stock, setStock] = useState(initialProduct?.stock?.toString() ?? "1");
  const [vendorPrice, setVendorPrice] = useState(initialProduct?.vendorPrice?.toString() ?? "");
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>(
    initialProduct?.images?.map((img: any, i: number) => ({
      preview: img.url,
      id: `existing-${i}`,
      isExisting: true,
    })) ?? []
  );

  const isSaving = isCreating || isUpdating;

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2),
    }));
    setImagePreviews((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImagePreviews((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Product name is required");
    if (!description.trim()) return toast.error("Description is required");
    if (!category) return toast.error("Please select a category");
    if (imagePreviews.length === 0) return toast.error("Please add at least one image");
    if (!vendorPrice || Number(vendorPrice) <= 0) return toast.error("Your cost price is required");
    if (!stock || Number(stock) < 0) return toast.error("Stock cannot be negative");

    try {
      const newImageFiles = imagePreviews.filter((img) => !img.isExisting && img.file);
      const images = await Promise.all(newImageFiles.map((img) => fileToBase64(img.file!)));

      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim(),
        category,
        stock: Number(stock),
        vendorPrice: Number(vendorPrice),
      };
      if (images.length > 0) {
        payload.images = images;
      }

      if (mode === "create") {
        await createAsync(payload);
      } else {
        await updateAsync({ id: productId!, payload });
      }

      router.push("/vendor/products");
    } catch {
      // toast already shown by the mutation's onError
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/vendor/products" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
            <FiArrowLeft /> Back to Products
          </Link>
          <h1 className="text-4xl font-light text-slate-900 mb-3 tracking-tight">
            {mode === "create" ? "Add Product" : "Edit Product"}
          </h1>
          <p className="text-slate-500 text-lg font-light">
            {mode === "create"
              ? "Submit your product for superadmin pricing approval."
              : "Update your product's catalog info, stock, or cost price."}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Product Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Premium Marble Floor Tiles"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Short Description</label>
            <input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One line summary"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your product..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select category</option>
                {categoriesLoading ? (
                  <option disabled>Loading categories...</option>
                ) : (
                  categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Stock Quantity *</label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Cost Price (₹) *</label>
            <input
              type="number"
              min={0}
              value={vendorPrice}
              onChange={(e) => setVendorPrice(e.target.value)}
              placeholder="100"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-500 mt-2">
              This is what you get paid per unit sold. Superadmin sets the customer-facing price separately.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Product Images *</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {imagePreviews.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary/local preview URLs, matches admin form convention
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors">
                <FiUpload className="w-5 h-5" />
                <span className="text-xs">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageSelect(e.target.files)}
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : mode === "create" ? "Submit Product" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
