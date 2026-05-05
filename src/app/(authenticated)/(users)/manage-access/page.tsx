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

const ManageAccessPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "permission">("search");
  const { data: manageAccessData, isLoading: manageAccessLoading } =
    useManageAccess(activeTab === "permission");
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex w-[300px] items-center gap-2 rounded-lg bg-white px-4 h-10">
              <MagnifyingGlass w={18} h={18} />
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                className={`px-3 py-1 rounded ${activeTab === "search" ? "bg-white text-black" : "text-white/80"}`}
                onClick={() => setActiveTab("search")}
              >
                Roles
              </button>
              <button
                className={`px-3 py-1 rounded ${activeTab === "permission" ? "bg-white text-black" : "text-white/80"}`}
                onClick={() => setActiveTab("permission")}
              >
                Permissions
              </button>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {activeTab === "search" ? (
              <div className="flex gap-2">
                <Button onClick={() => setModalOpen(true)}>Add</Button>
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
                    if (!selectedRole) return;
                    assignMutate({
                      roleId: Number(selectedRole),
                      permissionIds: Array.from(selectedPermissions).map((v) =>
                        Number(v),
                      ),
                    });
                  }}
                  disabled={!selectedRole || assignLoading}
                >
                  {assignLoading ? "Assigning..." : "Assign"}
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
