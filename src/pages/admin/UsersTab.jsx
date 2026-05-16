// File: src/pages/admin/UsersTab.jsx
import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Loader2, X, Search, Filter,
  MoreVertical, CheckCircle2, Mail, Phone,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usersApi } from "@/lib/api";
import { userSchema } from "@/lib/schemas";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContentHeader } from "@/components/admin/ContentHeader";
import { cn, formatDateDistance } from "@/lib/utils";
import { PhoneInputField } from "@/components/ui/phone-input";
import { useResponseDialog } from "@/components/ui/response-dialog";

const makeDefault = () => ({
  firstName: "", lastName: "", email: "", phoneNumber: "", role: "admin",
});

export const UsersTab = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const actionBtnRefs = useRef({});
  const [currentPage, setCurrentPage] = useState(1);
  const [dialog, showDialog] = useResponseDialog();
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get current logged-in user id to prevent self-delete
  const currentUserId = (() => {
    try { return JSON.parse(sessionStorage.getItem("adminUser") || "null")?.id ?? null; }
    catch { return null; }
  })();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await usersApi.list();
      const d = res?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const users = data || [];

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const showingStart = filteredUsers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * rowsPerPage, filteredUsers.length);

  const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: makeDefault(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => usersApi.create({ ...payload, password: "Tax@1234" }),
    onSuccess: () => { toast.success("User created!"); qc.invalidateQueries(["admin-users"]); closeForm(); },
    onError: (e) => toast.error(e?.message || "Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => usersApi.update(id, payload),
    onSuccess: () => { toast.success("User updated!"); qc.invalidateQueries(["admin-users"]); closeForm(); },
    onError: (e) => toast.error(e?.message || "Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => { toast.success("User deleted."); qc.invalidateQueries(["admin-users"]); },
    onError: (e) => toast.error(e?.message || "Failed to delete user"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => usersApi.bulkDelete(ids),
    onSuccess: () => { toast.success("Users deleted."); qc.invalidateQueries(["admin-users"]); setSelectedIds([]); },
    onError: (e) => toast.error(e?.message || "Failed to delete users"),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); reset(makeDefault()); };

  const onEdit = (user) => {
    setEditing(user);
    reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      role: (user.role || "admin").toLowerCase()
    });
    setShowForm(true);
    setShowActionMenu(null);
  };

  const onSubmit = (values) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload: values });
    else createMutation.mutate(values);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) setSelectedIds([]);
    else setSelectedIds(filteredUsers.map(u => u.id));
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <ContentHeader
          title={t("usersManagement")}
          breadcrumbs={[
            { label: "Users", path: "/admin/users" },
            { label: "List" }
          ]}
        >
          <Button onClick={() => { closeForm(); setShowForm(true); }} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> {t("addNew")}
          </Button>
        </ContentHeader>

        {/* Table Card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-muted/20">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10 rounded-xl bg-background border-border"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl animate-in slide-in-from-left-2 duration-300"
                  onClick={async () => {
                    const ok = await showDialog({ variant: "confirm", title: `Delete ${selectedIds.length} Users?`, subtitle: "This action cannot be undone. All selected users will be permanently removed.", confirmLabel: "Delete All", cancelLabel: "Cancel" });
                    if (ok) bulkDeleteMutation.mutate(selectedIds);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedIds.length})
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Show</span>
                <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-20 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? <SkeletonTable rows={5} cols={7} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-muted-foreground/30 accent-primary"
                        checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-12 px-2 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">#</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("name")}</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("emailAddress")}</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("role")}</th>
                    <th className="px-4 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Created At</th>
                    <th className="w-20 px-4 py-4 text-right font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedUsers.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">{t("noData")}</td></tr>
                  ) : paginatedUsers.map((u, index) => (
                    <tr key={u.id} className={cn("group transition-colors hover:bg-muted/30", selectedIds.includes(u.id) && "bg-primary/5")}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-muted-foreground/30 accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          checked={selectedIds.includes(u.id)}
                          disabled={u.id === currentUserId}
                          onChange={() => toggleSelect(u.id)}
                        />
                      </td>
                      <td className="px-2 py-4 text-muted-foreground font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/10">
                            {(u.firstName?.[0] || u.email?.[0] || "U").toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{u.firstName} {u.lastName}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {u.phoneNumber || "No phone"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {u.email}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={u.role?.toLowerCase() === "admin" ? "default" : "secondary"}
                          className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                        {formatDateDistance(u.createdAt || u.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          ref={(el) => (actionBtnRefs.current[u.id] = el)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={u.id === currentUserId}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + window.scrollY + 4,
                              right: window.innerWidth - rect.right,
                            });
                            setShowActionMenu(showActionMenu === u.id ? null : u.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-border bg-muted/10 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing <span className="font-semibold text-foreground">{showingStart}</span> to <span className="font-semibold text-foreground">{showingEnd}</span> of <span className="font-semibold text-foreground">{filteredUsers.length}</span> users
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "outline"}
                      size="sm"
                      className={cn("h-8 w-8 rounded-lg p-0", currentPage === pageNum && "bg-primary text-primary-foreground hover:bg-primary/90")}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit / Create Form — Portal at body level */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in duration-200 space-y-4"
            noValidate
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground">{editing ? t("edit") : t("addNew")} User</h3>
              <button type="button" onClick={closeForm} className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: t("firstName"), field: "firstName", placeholder: "John" },
                { label: t("lastName"), field: "lastName", placeholder: "Doe" },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
                  <Input placeholder={placeholder} {...register(field)} className={errors[field] ? "border-destructive" : "rounded-xl"} />
                  {errors[field] && <p className="mt-1 text-xs text-destructive">{errors[field].message}</p>}
                </div>
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("emailAddress")}</label>
              <Input type="email" placeholder="john@example.com" {...register("email")} className={errors.email ? "border-destructive" : "rounded-xl"} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("phone")}</label>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <PhoneInputField value={field.value} onChange={field.onChange} error={errors.phoneNumber} />
                )}
              />
              {errors.phoneNumber && <p className="mt-1 text-xs text-destructive">{errors.phoneNumber.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("role")}</label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="z-[10001]">
                      <SelectItem value="user">{t("user")}</SelectItem>
                      <SelectItem value="admin">{t("admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="mt-1 text-xs text-destructive">{errors.role.message}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={closeForm}>{t("cancel")}</Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {t("save")}
              </Button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Action Dropdown — Portal above pagination and all stacking contexts */}
      {showActionMenu !== null && createPortal(
        <>
          <div className="fixed inset-0 z-[9997]" onClick={() => setShowActionMenu(null)} />
          <div
            className="fixed z-[9998] w-44 rounded-xl border border-border bg-card p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ top: menuPosition.top, right: menuPosition.right }}
          >
            <button
              onClick={() => {
                const user = paginatedUsers.find(u => u.id === showActionMenu);
                if (user) onEdit(user);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit User</span>
            </button>
            <button
              onClick={async () => {
                const id = showActionMenu;
                setShowActionMenu(null);
                const ok = await showDialog({ variant: "confirm", title: "Delete User?", subtitle: "This action cannot be undone. The user will be permanently removed from the system.", confirmLabel: "Delete", cancelLabel: "Cancel" });
                if (ok) deleteMutation.mutate(id);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Response / Confirm Dialog */}
      {dialog}
    </>
  );
};
