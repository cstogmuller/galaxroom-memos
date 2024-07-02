import { Button, Dropdown, Input, Menu, MenuButton, MenuItem, Radio, RadioGroup } from "@mui/joy";
import { sortBy } from "lodash-es";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { userServiceClient } from "@/grpcweb";
import useCurrentUser from "@/hooks/useCurrentUser";
import { stringifyUserRole, useUserStore } from "@/store/v1";
import { RowStatus } from "@/types/proto/api/v1/common";
import { User, User_Role } from "@/types/proto/api/v1/user_service";
import { useTranslate } from "@/utils/i18n";
import Icon from "../Icon";

interface State {
  creatingUser: User;
}

const MemberSection = () => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const userStore = useUserStore();
  const [state, setState] = useState<State>({
    creatingUser: User.fromPartial({
      username: "",
      password: "",
      role: User_Role.USER,
    }),
  });
  const [users, setUsers] = useState<User[]>([]);
  const sortedUsers = sortBy(users, "id");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const users = await userStore.fetchUsers();
    setUsers(users);
  };

  const handleArchiveUserClick = async (user: User) => {
    const confirmed = window.confirm(t("setting.member-section.archive-warning", { username: user.nickname }));
    if (confirmed) {
      await userServiceClient.updateUser({
        user: {
          name: user.name,
          rowStatus: RowStatus.ARCHIVED,
        },
        updateMask: ["row_status"],
      });
      fetchUsers();
    }
  };

  const handleRestoreUserClick = async (user: User) => {
    await userServiceClient.updateUser({
      user: {
        name: user.name,
        rowStatus: RowStatus.ACTIVE,
      },
      updateMask: ["row_status"],
    });
    fetchUsers();
  };

  const handleDeleteUserClick = async (user: User) => {
    const confirmed = window.confirm(t("setting.member-section.delete-warning", { username: user.nickname }));
    if (confirmed) {
      await userStore.deleteUser(user.name);
      fetchUsers();
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 pt-2 pb-4">
      <div className="w-full flex flex-row justify-between items-center mt-6">
        <div className="title-text">{t("setting.member-list")}</div>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="inline-block min-w-full align-middle border rounded-lg dark:border-zinc-600">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-zinc-600">
            <thead>
              <tr className="text-sm font-semibold text-left text-gray-900 dark:text-gray-400">
                <th scope="col" className="px-3 py-2">
                  ID
                </th>
                <th scope="col" className="px-3 py-2">
                  {t("common.role")}
                </th>
                <th scope="col" className="px-3 py-2">
                  {t("common.username")}
                </th>
                <th scope="col" className="px-3 py-2">
                  {t("common.nickname")}
                </th>
                <th scope="col" className="px-3 py-2">
                  {t("common.email")}
                </th>
                <th scope="col" className="relative py-2 pl-3 pr-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-600">
              {sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 dark:text-gray-400">{user.id}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{stringifyUserRole(user.role)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {user.username}
                    <span className="ml-1 italic">{user.rowStatus === RowStatus.ARCHIVED && "(Archived)"}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{user.nickname}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium flex justify-end">
                    {currentUser?.id === user.id ? (
                      <span>{t("common.yourself")}</span>
                    ) : (
                      <Dropdown>
                        <MenuButton size="sm">
                          <Icon.MoreVertical className="w-4 h-auto" />
                        </MenuButton>
                        <Menu placement="bottom-end" size="sm">
                          {user.rowStatus === RowStatus.ACTIVE ? (
                            <MenuItem onClick={() => handleArchiveUserClick(user)}>{t("setting.member-section.archive-member")}</MenuItem>
                          ) : (
                            <>
                              <MenuItem onClick={() => handleRestoreUserClick(user)}>{t("common.restore")}</MenuItem>
                              <MenuItem onClick={() => handleDeleteUserClick(user)}>{t("setting.member-section.delete-member")}</MenuItem>
                            </>
                          )}
                        </Menu>
                      </Dropdown>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberSection;
