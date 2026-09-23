"use client";
import { useManageAccess } from "@/src/api/usersApi";
import type { Role as ApiRole } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { TableColumnsType, Select } from "antd";
import { useState, useEffect } from "react";
import RoleModal from "./RoleModal";
import { useRoleDropdown } from "@/src/api/dropdown";
import { useAssignPermissions, useRolePermissions } from "@/src/api/permissions";
import type { Permission as ApiPermission } from "@/src/api/permissions";
import { Spin } from "antd";
import AccessDenied from "@/src/components/common/AccessDenied";
import { toast } from "react-toastify";

const ManageAccessPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "permission">("search");
  // Both tabs need this — Roles renders `.roles` directly, Permissions needs
  // `.roles` for its dropdown and `.permissions` for the checklist — so it
  // must always be enabled, not just once the user switches to Permissions
  // (which was leaving the Roles tab's own table empty on first load).
  const { data: manageAccessData, isLoading: manageAccessLoading } =
    useManageAccess();
  const [selectedRole, setSelectedRole] = useState<string | undefined>(
    undefined,
  );
  const [cachedPermissions, setCachedPermissions] = useState<any[] | null>(
    null,
  );
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(),
  );
  const columnsPermissions = [
    {
      title: "Permission",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Guard",
      dataIndex: "guard_name",
      key: "guard_name",
      width: 160,
    },
    {
      title: "Assigned",
      key: "assigned",
      width: 120,
      render: (_: any, record: any) => {
        const id = String(record.id);
        return (
          <input
            type="checkbox"
            checked={selectedPermissions.has(id)}
            onChange={() => {
              setSelectedPermissions((s) => {
                const copy = new Set(s);
                if (copy.has(id)) copy.delete(id);
                else copy.add(id);
                return copy;
              });
            }}
          />
        );
      },
    },
  ];

  useEffect(() => {
    if (!cachedPermissions && manageAccessData?.permissions) {
      setCachedPermissions(manageAccessData.permissions);
    }
  }, [manageAccessData, cachedPermissions]);

  const { data: rolePermissions, isLoading: rolePermsLoading } =
    useRolePermissions(selectedRole);
  const { mutate: assignMutate, isPending: assignLoading } =
    useAssignPermissions();

  useEffect(() => {
    if (rolePermissions) {
      const ids = new Set((rolePermissions as ApiPermission[]).map((p) => String(p.id)));
      setSelectedPermissions(ids);
    }
  }, [rolePermissions]);

  const handleCancel = () => {
    setModalOpen(false);
  };
  const columns: TableColumnsType = [
    {
      title: "Role",
      dataIndex: "name",
      key: "name",
    },
  ];

  return (
    <div className="space-y-4 mt-4">
      {/* Filters Card */}
      <Card variant="green">
        {/* Search always gets its own complete row and the action buttons
            always get the row below — never sharing one row, at any width. This
            replaces `sm:flex-row`, which put search and buttons side by side
            from `sm` up: with a search box capped at `sm:w-[300px]` and a
            2-4 button group beside it, that row could exceed available width
            at in-between sizes (a 768px iPad, for example), forcing an uneven
            wrap of whichever few buttons didn't fit rather than a clean two-row
            layout. Unconditional `flex-col` removes the possibility entirely —
            each row is exactly one group, full width, every time. */}
        <div className="flex flex-col gap-3">
          {/* This page has its own search+tabs pairing that the sweep above
              never touched — different class signature (`flex items-center
              gap-4`, no responsive handling at all) from the pattern shared
              by the other 7 pages in this section, so it kept the exact same
              bug: search's `w-full` fighting the Roles/Permissions toggle for
              the same non-wrapping row. Same fix, unconditional `flex-col` —
              search gets its own row, the toggle gets the row below, neither
              ever has to share space with the other. */}
          <div className="flex flex-col gap-3">
            <div className="flex w-full items-center gap-2 rounded-lg bg-white px-4 h-10">
              <MagnifyingGlass w={18} h={18} />
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              />
            </div>

            <div className="flex w-full items-center gap-3">
              <button
                className={`flex-1 px-3 py-1 rounded ${activeTab === "search" ? "bg-white text-black" : "text-white/80"}`}
                onClick={() => setActiveTab("search")}
              >
                Roles
              </button>
              <button
                className={`flex-1 px-3 py-1 rounded ${activeTab === "permission" ? "bg-white text-black" : "text-white/80"}`}
                onClick={() => setActiveTab("permission")}
              >
                Permissions
              </button>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {activeTab === "search" ? (
              // `w-full` — a single button in its own row otherwise sat at
              // natural size flush left with a large gap of empty green
              // trailing it, same as every other lone-item row fixed this
              // session.
              <div className="flex flex-wrap gap-2 w-full">
                <Button className="w-full" onClick={() => setModalOpen(true)}>Add</Button>
              </div>
            ) : (
              // Permissions tab: show nothing initially
              <div />
            )}
          </div>
        </div>
      </Card>
      {/* Main Content: table for Search tab, roles dropdown for Permissions tab */}
      {activeTab === "search" ? (
        <DataTable
          columns={columns}
          loading={manageAccessLoading}
          dataSource={manageAccessData?.roles}
          rowKey={(data) => data.id}
          pagination={false}
        />
      ) : (
        <div className="bg-white rounded-xl p-4">
          <p className="mb-2 text-sm text-gray-600">Permissions</p>
          <div className="max-w-full">
            <div className="mb-4 max-w-md flex items-center gap-2">
              <div className="w-full flex items-center gap-2">
                <Select
                  allowClear
                  value={selectedRole}
                  onChange={(val) =>
                    setSelectedRole(val ? String(val) : undefined)
                  }
                  placeholder="Select role"
                  options={( (manageAccessData?.roles || []) as ApiRole[] ).map((r) => ({ label: r.name, value: String(r.id) }))}
                  style={{ width: 300 }}
                  optionLabelProp="label"
                  disabled={assignLoading}
                />
                <Button
                  type="primary"
                  onClick={() => {
                    if (!selectedRole) {
                      toast.error("Please select a role first");
                      return;
                    }
                    assignMutate({
                      roleId: Number(selectedRole),
                      permissionIds: Array.from(selectedPermissions).map((v) =>
                        Number(v),
                      ),
                    });
                  }}
                  loading={assignLoading}
                >
                  Assign
                </Button>
              </div>
            </div>

            {manageAccessLoading || rolePermsLoading || assignLoading ? (
              <div className="p-6 flex items-center justify-center">
                <Spin />
              </div>
            ) : (
              <DataTable
                columns={columnsPermissions}
                loading={false}
                dataSource={
                  cachedPermissions || manageAccessData?.permissions || []
                }
                rowKey={(data) => String(data.id)}
                pagination={false}
              />
            )}
          </div>
        </div>
      )}
      {modalOpen && (
        <RoleModal handleCancel={handleCancel} modalOpen={modalOpen} />
      )}
    </div>
  );
};

export default ManageAccessPage;
